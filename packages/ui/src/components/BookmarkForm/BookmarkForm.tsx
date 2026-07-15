import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "../../i18n/I18nContext";
import styles from "./BookmarkForm.module.css";

export interface BookmarkFormValues {
  url: string;
  title: string;
  description?: string;
}

export interface BookmarkFormProps {
  initial?: BookmarkFormValues;
  onSave: (values: BookmarkFormValues) => void;
  onCancel: () => void;
}

function deriveTitleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Two-step flow per FEATURE_SPECS.md § Bookmarks: URL first, then a title
// auto-derived from the hostname once (editable, and never overwritten once
// the user has touched the title field themselves).
export function BookmarkForm({ initial, onSave, onCancel }: BookmarkFormProps) {
  const t = useTranslation();
  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [titleTouched, setTitleTouched] = useState(Boolean(initial));

  function handleUrlBlur() {
    if (!titleTouched && !title.trim() && url.trim()) {
      const derived = deriveTitleFromUrl(url.trim());
      if (derived) setTitle(derived);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    if (!trimmedUrl || !trimmedTitle) return;
    onSave({ url: trimmedUrl, title: trimmedTitle, description: description.trim() || undefined });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        {t("bookmark.url")}
        <input
          type="url"
          required
          autoFocus={!initial}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleUrlBlur}
        />
      </label>
      <label className={styles.field}>
        {t("bookmark.title")}
        <input
          type="text"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleTouched(true);
          }}
        />
      </label>
      <label className={styles.field}>
        {t("bookmark.description")}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className={styles.actions}>
        <button type="button" onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button type="submit">{t("common.save")}</button>
      </div>
    </form>
  );
}
