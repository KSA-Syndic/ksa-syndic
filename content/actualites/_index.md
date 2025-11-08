+++
date = '2025-11-07T22:28:42+01:00'
draft = false
type = 'posts'
title = 'Actualités'
bookCollapseSection = false
+++


# Actualités

{{% details "Table des contenus de la section" %}}
<ul>
{{ range .Pages }}
  <li><a href="{{ .RelPermalink }}">{{ .Title }}</a></li>
{{ end }}
</ul>
{{% /details %}}
