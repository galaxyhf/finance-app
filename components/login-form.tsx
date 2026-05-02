"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn(mode: "signIn" | "signUp") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setMessage("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    const supabase = createBrowserClient(url, key);
    setLoading(true);
    setMessage("");
    const result =
      mode === "signIn"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Acessar dashboard</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Input type="email" placeholder="email@dominio.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input type="password" placeholder="Senha" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button disabled={loading || !email || !password} onClick={() => void signIn("signIn")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Entrar
        </Button>
        <Button disabled={loading || !email || !password} variant="outline" onClick={() => void signIn("signUp")}>
          Criar conta
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
