import { Template } from "../types";

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysUntil(d: string) {
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const PLACEHOLDER_VARIABLES = [
  "{{Employee_Name}}",
  "{{Date}}",
  "{{Salary}}",
  "{{Designation}}",
  "{{Department}}",
  "{{Join_Date}}",
  "{{Company_Name}}",
  "{{Manager_Name}}",
  "{{Address}}",
  "{{Employee_ID}}",
  "{{Notice_Period}}",
  "{{Effective_Date}}",
];

export function formatPrintContent(editorContent: string) {
  let html = editorContent;
  PLACEHOLDER_VARIABLES.forEach((v) => {
    const regex = new RegExp(v.replace(/[{}]/g, "\\$&"), "g");
    html = html.replace(regex, `<span style=\"color:#E31E24;text-decoration:underline\">${v}</span>`);
  });

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv.querySelectorAll("span[contenteditable]").forEach((el) => {
    const text = el.textContent || "";
    const replacement = document.createElement("span");
    replacement.style.color = "#E31E24";
    replacement.style.textDecoration = "underline";
    replacement.textContent = text;
    el.replaceWith(replacement);
  });

  return tempDiv.innerHTML;
}

export function buildTemplatePayload(templateName: string, category: string, contentHtml: string) {
  return { templateName, category, contentHtml };
}

export function buildCreateTemplatePayload(name: string, category: string) {
  return { templateName: name, category, contentHtml: "" };
}
