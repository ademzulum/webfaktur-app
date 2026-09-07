"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { anmelden, type Anmeldezustand } from "./actions";

const startzustand: Anmeldezustand = {};

export default function Anmeldeseite() {
  const [zustand, aktion, laeuft] = useActionState(anmelden, startzustand);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <Card>
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>
            Zugang zu deinem Webfaktur-Bereich.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={aktion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwort">Passwort</Label>
              <Input
                id="passwort"
                name="passwort"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            {zustand.fehler ? (
              <p
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {zustand.fehler}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={laeuft}>
              {laeuft ? "Wird geprüft …" : "Anmelden"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
