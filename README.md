# Personal Wiki, umgesetzt mit Theia und einem Personal Wiki Plugin

## Voraussetzung für den Build:

- Docker (Verwendete Version: version 20.10.7, build f0df350). Der Build sollte mit den meisten Versionen funktionieren.

Das Personal Wiki ist plattformunabhängig und wurde auf Windows 10 und Linux (Ubuntu Version 20.04 LTS) getestet.

## Build durchführen:

Kommandozeilenfenster (Bash oder Cmd) öffnen und zum Ordner navigieren. Anschließend das Kommando **docker build docker build . -t theiawiki** ausführen.
Der Build wird nun durchgeführt.

## Docker-Container starten

Aus dem erstellen Image kann mit dem Befehl **docker run -dp 3000:3000 -p 9000:9000 theiawiki** ein laufender Docker-Container gestartet werden.

## Auf das Personal Wiki zugreifen

Es wird vorausgesetzt, dass der Docker-Container auf dem lokalen System bespielt wird. Das Personal Wiki ist lokal im Browser unter http://localhost:3000 aufrufbar.

## Auf das Personal Wiki im Lesemodus zugreifen (gerendertes HTML im read-only Modus)

Es wird vorausgesetzt, dass der Docker-Container auf dem lokalen System bespielt wird. Der Lesemodus ist lokal im Browser unter http://localhost:9000 aufrufbar.

## Kommandos

Das Plugin und alle Abhängigkeiten (Python + Libs) sind vorinstalliert. Die Command-Pane öffnet sich mit (strg+shift+p). Mögliche Wiki-Features sind:

- quickstart wiki (Wiki-Server wird gestartet, eine Verbindung wird erstellt und das geöffnete Projekt in Theia wird als Wiki initialisiert)
- disconnect from Wiki Server (Trennt die Verbindung und killt den Wiki-Server-Prozess)
- render wikipage (man kann auch localhost:9000 ansteuert, um das Wiki im gerendertem Modus im Browser zu sehen (Wiki muss initialisiert sein) )
- count word for current Wikipage
- count words for whole wiki
- dynamische Funktionen (Wikiseite umbenennen => alle Wikilinks, die auf diese Seite verweisen, werden ebenfalls umbenannt)
- search Wiki (In der Bachelorarbeit unter ("Systemanforderungen") wird genau beschrieben welche Möglichkeiten es für die Suche gibt (Stichwortsuche oder Tagsuche)
- create wikilink
    - ausgeführt auf ein selektiertes Wort: erstelle eine Wikiseite mit dem Namen des selektierten Wortes sowie den passenden Wikilink
    - ausgeführt ohne ein selektiertes Wort: 
        - Gibt es Grafiken im Wiki, wird man aufgefordert eine auszuwählen, auf die verlinkt werden soll
        - Gibt es keine Grafiken im Wiki, wird ein leerer Imagelink-Tag erstellt
