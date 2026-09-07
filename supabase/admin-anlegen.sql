-- ============================================================================
-- Einmalig ausführen: das eigene Anmeldekonto zum Admin machen.
--
-- Voraussetzung: Das Konto wurde bereits unter Authentication -> Users
-- angelegt. Diese Datei verbindet es nur mit der Rolle "admin".
--
-- ANLEITUNG: Unten die E-Mail-Adresse durch die eigene ersetzen.
-- ============================================================================

insert into public.nutzer (id, rolle, name)
select u.id, 'admin', 'Adem'
from auth.users u
where u.email = 'HIER-DEINE-EMAIL-EINTRAGEN'
on conflict (id) do update set rolle = 'admin';


-- Kontrollausgabe: Wurde die Zeile angelegt?
-- Leeres Ergebnis bedeutet, dass die E-Mail oben nicht zu einem Konto passt.
select n.id, n.rolle, n.name, u.email
from public.nutzer n
join auth.users u on u.id = n.id;
