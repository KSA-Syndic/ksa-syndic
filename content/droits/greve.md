+++
date = '2025-11-07T22:23:28+01:00'
draft = false
title = 'Grève'
+++

{{< image src="droit-greve.jpg" alt="Le droit de grève - manifestation de la CFDT Bretagne" title="Le droit de grève - manifestation de la CFDT Bretagne" loading="lazy" >}}

{{% hint info %}}
Ce guide explique simplement le droit de grève et comment se déclarer à KUHN.
{{% /hint %}}

## Quand et comment faire grève ?

La grève est un **droit constitutionnel** : elle suspend simplement le contrat de travail pendant la durée de la grève.

{{% hint success %}}
Dans le secteur privé, **aucun préavis n'est nécessaire** !
Vous pouvez vous déclarer en grève à tout moment, même à la dernière minute (mais prévenir à l'avance reste préférable).
{{% /hint %}}

Pour qu'une grève soit valable, il faut :

- Être au moins deux salariés
- Avoir des revendications transmises à l’employeur

Le plus souvent, ce sont les syndicats (d’entreprise, de branche ou nationaux) qui appellent à la grève.

## Durée de la grève

La grève peut durer **le temps que vous souhaitez** : une journée, une heure, ou même 23 minutes !

L’employeur déduit le temps de grève du salaire, même pour les forfaits jours. Exemple : 1h de grève = 1/7e d’une journée (base 35h/semaine).

## Comment se déclarer en grève à KUHN ?

1. **Préviens le syndicat** ([contact](../../contact))
2. **Préviens ton employeur** (manager)

### Pour une journée ou demi-journée

Fais une demande d’absence sur Kelio en sélectionnant `Grève` et `Date à date` ou `Date à date avec demi-journée`.

{{<image src="demande-absence-greve.png" alt="Demande absence grève sur Kelio" title="Demande absence grève sur Kelio" loading="lazy" >}}

### Pour quelques heures

Fais une demande d’absence sur Kelio en sélectionnant `Grève` et `Date à date heure à heure`.

{{% details "Voir le schéma récapitulatif (cliquer pour dérouler)" %}}
{{< mermaid >}}
flowchart TD
%% === Styles ===
classDef decision fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px,color:#000;
classDef action fill:#E8F5E9,stroke:#43A047,stroke-width:2px,color:#000;
classDef blocked fill:#FFEBEE,stroke:#E53935,stroke-width:2px,color:#000;
classDef success fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px,color:#000;

    %% === Nodes ===
    A[Envie de faire grève ?]

    B{{"
    Préavis syndical
    (national, branche, entreprise)
    OU
    action collective
    (≥ 2 salariés avec revendications)
    ?"}}

    Z["
    Grève impossible
    sans préavis légal
    "]

    F1[Grève licite possible]

    G{{"Durée prévue ?"}}

    H["
    Déclarer absence
    sur Kelio
    (Date à date)
    "]

    I["
    Déclarer absence
    sur Kelio
    (Date à date avec demi-journée)
    "]

    J["
    Déclarer absence
    sur Kelio
    (Date à date heure à heure)
    "]

    K["Je vais en grève !"]

    %% === Links ===
    A --> B
    B -- Non --> Z
    B -- Oui --> F1
    F1 --> G
    G -- Journée --> H
    G -- Demi-journée --> I
    G -- "Quelques heures" --> J
    H --> K
    I --> K
    J --> K

    %% === Apply styles ===
    class B,G decision
    class F1,H,I,J action
    class Z blocked
    class K success

{{< /mermaid >}}
{{% /details %}}

{{% hint warning %}}
N’hésite pas à contacter le syndicat pour toute question ou accompagnement !
{{% /hint %}}
