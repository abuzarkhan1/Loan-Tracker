export type TemplateVariables = Record<string, string | number | Date | undefined | null>;

export const renderTemplate = (template: string, variables: TemplateVariables) =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) return "";
    if (value instanceof Date) return value.toLocaleDateString("en-PK");
    return String(value);
  });
