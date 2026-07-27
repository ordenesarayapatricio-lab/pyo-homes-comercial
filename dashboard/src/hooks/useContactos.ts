import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Contacto } from "../lib/mockData";

export function useContactos() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vista_progreso_leads")
      .select("*")
      .order("fecha_ingreso", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setContactos((data ?? []) as Contacto[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { contactos, loading, error, refresh };
}
