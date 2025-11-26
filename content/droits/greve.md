---
date: "2025-11-07T22:23:28+01:00"
draft: false
title: "Grève"
type: "docs"
tags: ["droits", "grève", "congés"]
---

{{< image src="/uploads/images/droits/droit-greve.jpg" alt="Le droit de grève - manifestation de la CFDT Bretagne" title="Le droit de grève - manifestation de la CFDT Bretagne" loading="lazy" >}}

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

{{% details "Voir plus" %}}
### Que dit la loi ?

Une grève correspond à une "cessation collective et concertée du travail dont l'objectif est d'appuyer des revendications professionnelles". Elle se caractérise par un arrêt total de travail sur une durée variable : d'une heure à plusieurs jours ou semaines.

Le fait d'être syndiqué n'est pas obligatoire pour faire grève. C'est un droit fondamental et constitutionnel depuis 1946.

Ce droit s'applique à tous les salariés, sauf exceptions (militaires, policiers actifs, magistrats judiciaires, administration pénitentiaire, transmissions du ministère de l'Intérieur).

> Aucun salarié ne peut être sanctionné, licencié ou discriminé pour l'exercice normal du droit de grève (article L1132-2 du Code du travail).

### Comment se déclarer en grève dans le privé ?

Dans le privé, un mouvement de grève peut être déclenché à tout moment, sans préavis ni obligation de prévenir l'employeur.

L'employeur doit cependant avoir connaissance des revendications au moment de l'arrêt de travail.

En cas de grève nationale et interprofessionnelle, les revendications collectives de l'appel national suffisent.

Pour la bonne organisation, prévenir sa direction ou son manager (par mail ou oralement) la veille ou le matin de la grève est recommandé, mais non obligatoire.

Une fois déclaré en grève, le salarié du privé choisit la durée, peut manifester, rester chez lui, ou faire grève sur son lieu de travail (sans empêcher les non-grévistes de travailler).
{{% /details %}}

## Durée de la grève

La grève peut durer **le temps que vous souhaitez** : une journée, une heure, ou même 23 minutes !

L’employeur déduit le temps de grève du salaire, même pour les forfaits jours. Exemple : 1h de grève = 1/7e d’une journée (base 35h/semaine).

## Comment se déclarer en grève à KUHN ?

1. **Préviens le syndicat** ([contact](/contact))
2. **Préviens ton employeur** (manager)

### Pour une journée ou demi-journée

Fais une demande d’absence sur Kelio en sélectionnant `Grève` et `Date à date` ou `Date à date avec demi-journée`.

{{<image src="/uploads/images/droits/demande-absence-greve.png" alt="Demande absence grève sur Kelio" title="Demande absence grève sur Kelio" loading="lazy" >}}

### Pour quelques heures

Fais une demande d’absence sur Kelio en sélectionnant `Grève` et `Date à date heure à heure`.

{{% details "Voir schéma récapitulatif" %}}
## Schéma recapitulatif
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
    "]

    F1[Grève possible]

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

{{% hint success %}}
N’hésite pas à contacter ton syndicat pour toute question ou accompagnement !
{{% /hint %}}
