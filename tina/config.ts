import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "static/upload/",
    basePath: "/cfdt-kuhn/",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },

  schema: {
    collections: [
      // === 1. ACTUALITÉS ===
      {
        name: "actualite",
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
          { type: "string", name: "categories", label: "Catégories", list: true, ui: { component: "tags" } },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },

      // === 2. DROITS ===
      {
        name: "droit",
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
          { type: "string", name: "categories", label: "Catégories", list: true, ui: { component: "tags" } },
          { type: "rich-text", name: "body", label: "Contenu", isBody: true },
        ],
      },

      // === 3. DOCUMENTS ===
      {
        name: "my_document",
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
        label: "Page Contact",
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