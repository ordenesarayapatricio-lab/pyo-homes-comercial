'use strict';

// En producción (EasyPanel) las variables de entorno ya vienen inyectadas directamente;
// dotenv no las pisa si ya existen, así que esto solo tiene efecto en desarrollo local
// leyendo el .env del proyecto.
require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// `verify` guarda el body crudo en req.rawBody — lo necesita el webhook de Calendly
// para validar la firma HMAC (la firma se calcula sobre los bytes exactos recibidos,
// no sobre el JSON ya parseado, que puede reordenar/reserializar claves).
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// Cliente de Supabase con la service role key — solo para escrituras que no vienen de
// una sesión de navegador (ej. el webhook de Calendly), así que necesita bypassear RLS.
// Nunca se expone al cliente; vive solo en este servidor.
const supabaseAdmin =
    process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
        ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
        : null;

// Serve static assets from /public
app.use(express.static(path.join(__dirname, 'public')));

// Estos 3 endpoints solo deben poder llamarlos usuarios ya logueados en el
// dashboard (nunca un tercero anónimo que adivine la ruta): verifica el JWT
// de Supabase enviado en el header Authorization contra el propio Supabase
// Auth (no confía en el token, lo valida contra el servidor). Deja pasar solo
// si es válido y no está expirado; si no, corta con 401 antes de tocar nada.
async function requireDashboardAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token || !supabaseAdmin) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

// Health check — required by EasyPanel
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Notifica a n8n cuando se crea un lead nuevo desde el CRM. Se hace server-side
// (no un fetch directo del navegador al webhook) por el mismo criterio ya aplicado
// al proxy de geocodificación: nunca llamar servicios de terceros desde el cliente.
// Si N8N_NEW_LEAD_WEBHOOK_URL no está configurada, solo se loggea el payload —
// nunca debe romper la creación del lead en el CRM.
app.post('/api/webhooks/nuevo-lead', requireDashboardAuth, async (req, res) => {
    const webhookUrl = process.env.N8N_NEW_LEAD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[webhook nuevo-lead] N8N_NEW_LEAD_WEBHOOK_URL no configurada, payload recibido:', JSON.stringify(req.body));
        return res.status(200).json({ forwarded: false });
    }
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        res.status(200).json({ forwarded: true, status: response.status });
    } catch (err) {
        console.warn('[webhook nuevo-lead] No se pudo reenviar a n8n:', err.message);
        res.status(200).json({ forwarded: false, error: err.message });
    }
});

// Notifica a n8n cuando se reagenda una actividad arrastrándola a otro día en el
// Calendario, para que dispare un WhatsApp de confirmación al cliente ("te confirmo
// el cambio de nuestra visita para..."). El texto exacto lo redacta el workflow de
// n8n a partir de este payload — mismo criterio que el resto de webhooks de este
// archivo. Efecto secundario de una acción que ya se guardó en Supabase antes de
// llamar acá, así que nunca debe bloquear ni fallar visiblemente.
app.post('/api/webhooks/reagendamiento', requireDashboardAuth, async (req, res) => {
    const webhookUrl = process.env.N8N_RESCHEDULE_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[webhook reagendamiento] N8N_RESCHEDULE_WEBHOOK_URL no configurada, payload recibido:', JSON.stringify(req.body));
        return res.status(200).json({ forwarded: false });
    }
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        res.status(200).json({ forwarded: true, status: response.status });
    } catch (err) {
        console.warn('[webhook reagendamiento] No se pudo reenviar a n8n:', err.message);
        res.status(200).json({ forwarded: false, error: err.message });
    }
});

// Notifica a n8n cuando se lanza una campaña masiva desde la selección múltiple de
// Leads ("Enviar Propiedad"). A diferencia de /nuevo-lead (efecto secundario que nunca
// debe fallar visiblemente), esta acción SÍ es lo único que hace el botón, así que si
// la URL está configurada y el reenvío falla, respondemos error para que el CRM lo muestre.
app.post('/api/webhooks/campana-masiva', requireDashboardAuth, async (req, res) => {
    const webhookUrl = process.env.N8N_BULK_CAMPAIGN_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('[webhook campana-masiva] N8N_BULK_CAMPAIGN_WEBHOOK_URL no configurada, payload recibido:', JSON.stringify(req.body));
        return res.status(200).json({ forwarded: false });
    }
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        if (!response.ok) {
            return res.status(502).json({ forwarded: false, status: response.status });
        }
        res.status(200).json({ forwarded: true, status: response.status });
    } catch (err) {
        console.warn('[webhook campana-masiva] No se pudo reenviar a n8n:', err.message);
        res.status(502).json({ forwarded: false, error: err.message });
    }
});

// Valor UF del día para la Ficha de Propiedad (precio UF con equivalente CLP).
// Proxy a mindicador.cl (API pública del Banco Central, sin key) — mismo criterio que
// el resto de este archivo: nunca se llama a un tercero directo desde el navegador.
// Cacheado en memoria por fecha para no golpear la API en cada carga de la página; si
// la consulta falla, se sirve el último valor cacheado (o null si nunca hubo uno) en
// vez de romper el render de la ficha.
let ufCache = { valor: null, fecha: null };
app.get('/api/uf-hoy', async (_req, res) => {
    const hoy = new Date().toISOString().slice(0, 10);
    if (ufCache.fecha === hoy) {
        return res.json(ufCache);
    }
    try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        const serie = data.serie && data.serie[0];
        if (serie && typeof serie.valor === 'number') {
            ufCache = { valor: serie.valor, fecha: hoy };
        }
    } catch (err) {
        console.warn('[uf-hoy] No se pudo consultar mindicador.cl:', err.message);
    }
    res.json(ufCache);
});

// Agendamiento de clientes vía Cal.com: cuando un lead reserva una visita/reunión en el
// link de Cal.com compartido, Cal.com avisa acá y se crea automáticamente una actividad
// en el CRM (visible en el Calendario interno). Se eligió Cal.com sobre Calendly porque
// el plan gratuito de Calendly no incluye webhooks (requiere el plan Standard de pago);
// Cal.com sí los incluye gratis. Cal.com firma cada webhook con HMAC-SHA256 sobre el
// body crudo (header `X-Cal-Signature-256`, hex plano, sin el esquema "t=,v1=" de
// Calendly) — se valida contra CAL_COM_WEBHOOK_SECRET antes de procesar nada. Si el
// secreto no está configurado todavía, no se puede verificar (se deja pasar solo para
// no bloquear el desarrollo local — no debe quedar así en producción).
function verifyCalComSignature(req) {
    const secret = process.env.CAL_COM_WEBHOOK_SECRET;
    if (!secret) return true;
    const received = req.headers['x-cal-signature-256'];
    if (!received) return false;
    const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(String(received), 'hex');
    return expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

app.post('/api/webhooks/booking', async (req, res) => {
    if (!verifyCalComSignature(req)) {
        return res.status(401).json({ error: 'Firma inválida' });
    }
    if (!supabaseAdmin) {
        console.warn('[booking] SUPABASE_URL/SUPABASE_SECRET_KEY no configuradas, no se puede procesar el evento');
        return res.status(200).json({ processed: false });
    }

    // Log del payload crudo — Cal.com puede variar detalles del formato entre cuentas/
    // versiones; esto permite ajustar el parseo rápido contra un evento real sin adivinar.
    console.log('[booking] evento recibido:', JSON.stringify(req.body));

    const { triggerEvent, payload } = req.body || {};
    try {
        if (triggerEvent === 'BOOKING_CREATED') {
            const attendee = payload?.attendees?.[0] || {};
            const email = attendee.email || null;
            const nombre = attendee.name || payload?.organizer?.name || 'Invitado';
            const bookingUri = payload?.uid || null;

            let contactoId = null;
            if (email) {
                const { data: existente, error: selectError } = await supabaseAdmin
                    .from('contactos')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();
                if (selectError) throw selectError;
                if (existente) {
                    contactoId = existente.id;
                } else {
                    const { data: nuevo, error: insertContactoError } = await supabaseAdmin
                        .from('contactos')
                        .insert({ nombre, email, tipo_contacto: ['comprador'] })
                        .select('id')
                        .single();
                    if (insertContactoError) throw insertContactoError;
                    contactoId = nuevo.id;
                }
            }

            const { error: insertCardError } = await supabaseAdmin.from('activity_cards').insert({
                title: `Reunión con ${nombre}`,
                column_id: 'todo',
                contacto_id: contactoId,
                scheduled_at: payload?.startTime ?? null,
                tipo_actividad: 'Visita venta y Negociación',
                booking_event_uri: bookingUri,
            });
            if (insertCardError) throw insertCardError;
        } else if (triggerEvent === 'BOOKING_CANCELLED') {
            const bookingUri = payload?.uid || null;
            if (bookingUri) {
                const { error: deleteError } = await supabaseAdmin
                    .from('activity_cards')
                    .delete()
                    .eq('booking_event_uri', bookingUri);
                if (deleteError) throw deleteError;
            }
        }
        res.status(200).json({ processed: true });
    } catch (err) {
        console.error('[booking] Error procesando webhook:', err.message);
        res.status(500).json({ processed: false, error: err.message });
    }
});

// Dashboard SPA: serve its index.html for any /dashboard/* route not matched
// by a static file, so React Router handles client-side routes on refresh.
app.get('/dashboard/*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
});

// Fallback: serve index.html for any unmatched route (SPA-style)
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`PyO Homes Comercial — servidor corriendo en puerto ${PORT}`);
});
