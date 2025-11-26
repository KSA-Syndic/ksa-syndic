import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      publicFolder: "static",
      mediaRoot: "uploads",
    },
  },

  schema: {
    collections: [
      // === 1. ACTUALITÉS ===
      {
        name: "mon_actualite",
        label: "Actualités",
        path: "content/actualites",
        format: "md",
        match: {
          include: "**/*",
          exclude: "_*",
        },
        defaultItem: () => ({
          date: new Date().toISOString(),
          draft: true,
          bookToC: false,
          type: "posts",
        }),
        ui: {
          filename: {
            slugify: (values) => {
              const date = new Date().toISOString().split("T")[0];
              const slug = values.title?.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") || "nouvelle";
              return `${date}-${slug}`;
            },
          },
        },
        fields: [
          { type: "string", name: "title", label: "Titre", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Date", ui: { dateFormat: "YYYY-MM-DD" } },
          { type: "boolean", name: "draft", label: "Brouillon" },
          { type: "boolean", name: "bookToC", label: "Afficher table des matières latérale" },
          { type: "string", name: "type", label: "Type", options: ["posts"], ui: { component: "hidden" } },
          { type: "string", name: "tags", label: "Tags", list: true, ui: { component: "tags" } },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },

      // === 2. DROITS ===
      {
        name: "mes_droits",
        label: "Droits",
        path: "content/droits",
        format: "md",
        match: {
          include: "**/*",
          exclude: "_*",
        },
        defaultItem: () => ({
          date: new Date().toISOString(),
          draft: true,
          bookToC: true,
          type: "docs",
        }),
        fields: [
          { type: "string", name: "title", label: "Titre", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Date" },
          { type: "boolean", name: "draft", label: "Brouillon" },
          { type: "boolean", name: "bookToC", label: "Afficher table des matières latérale" },
          { type: "string", name: "type", label: "Type", options: ["docs"], ui: { component: "hidden" } },
          { type: "string", name: "tags", label: "Tags", list: true, ui: { component: "tags" } },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },

      // === 3. DOCUMENTS ===
      {
        name: "mes_documents",
        label: "Documents",
        path: "content/documents",
        format: "md",
        match: {
          include: "**/*",
          exclude: "_*",
        },
        fields: [
          { type: "string", name: "title", label: "Titre", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Date" },
          { type: "boolean", name: "draft", label: "Brouillon" },
          { type: "boolean", name: "bookToC", label: "Afficher table des matières latérale" },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },

      // === 4. CONTACT ===
      {
        name: "page_contact",
        label: "Contact",
        path: "content",
        format: "md",
        match: {
          include: "contact",
        },
        fields: [
          { type: "string", name: "title", label: "Titre", required: true },
          { type: "datetime", name: "date", label: "Date", ui: { dateFormat: "YYYY-MM-DD", timeFormat: "HH:mm" } },
          { type: "boolean", name: "bookToC", label: "Afficher table des matières latérale" },
          { type: "string", name: "type", label: "Type", options: ["posts"], ui: { component: "hidden" } },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },
    ],
  },
});