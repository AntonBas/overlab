import { RowAction, RowActions } from "../../../../components/admin/RowActions";
import { useState, type FormEvent } from "react";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { FormField } from "../../../../components/ui/FormField";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { Spinner } from "../../../../components/ui/Spinner";
import { useFetch } from "../../../../hooks/useFetch";
import { usePageTitle } from "../../../../hooks/usePageTitle";
import {
  createCategory,
  createCategoryMatchup,
  deleteCategory,
  deleteCategoryMatchup,
  fetchCategories,
  fetchCategoryMatchups,
  updateCategory,
  updateCategoryMatchup,
} from "../api/relationsAdminApi";
import { ConfirmDialog } from "../../../../components/admin/ConfirmDialog";
import { DataTable } from "../../../../components/admin/DataTable";
import { Drawer } from "../../../../components/admin/Drawer";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
} from "../../../../components/admin/Fields";
import { StatusMessage } from "../../../../components/admin/StatusMessage";
import { useHeroOptions } from "../../../heroes/admin";
import { useAdminForm } from "../../../../components/admin/useAdminForm";
import { useSave } from "../../../../components/admin/useSave";
import type {
  AdminCategory,
  AdminCategoryMatchup,
  CategoryMatchupType,
} from "../types";
import type { AdminHero } from "../../../heroes/admin";

const MATCHUP_LABELS: Record<CategoryMatchupType, string> = {
  STRONG_AGAINST: "Strong against",
  WEAK_AGAINST: "Struggles against",
  WORKS_WITH: "Works well with",
};

interface CategoryFormProps {
  category: AdminCategory | null;
  heroes: AdminHero[];
  onSaved: () => void;
  onClose: () => void;
}

function CategoryForm({
  category,
  heroes,
  onSaved,
  onClose,
}: CategoryFormProps) {
  const initialMembers = category?.heroSlugs ?? [];
  const [members, setMembers] = useState(() => new Set(initialMembers));
  const membersChanged =
    members.size !== initialMembers.length ||
    initialMembers.some((heroSlug) => !members.has(heroSlug));
  const { values, change, save } = useAdminForm(
    {
      slug: category?.slug ?? "",
      name: category?.name ?? "",
      description: category?.description ?? "",
    },
    membersChanged,
  );
  const { slug, name, description } = values;

  function toggleMember(heroSlug: string) {
    setMembers((current) => {
      const next = new Set(current);
      if (next.has(heroSlug)) {
        next.delete(heroSlug);
      } else {
        next.add(heroSlug);
      }
      return next;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      slug,
      name,
      description: description.trim() === "" ? null : description,
      heroSlugs: [...members],
    };
    const saved = await save.run(
      () =>
        category
          ? updateCategory(category.id, payload)
          : createCategory(payload),
      "Category saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>{category ? `Edit ${category.name}` : "New category"}</h2>
      <FormField
        label="Name"
        name="name"
        required
        value={name}
        error={save.fieldErrors.name}
        onChange={(event) => change("name", event.target.value)}
      />
      <FormField
        label="Slug"
        name="slug"
        required
        value={slug}
        error={save.fieldErrors.slug}
        hint="Lowercase letters, digits and dashes, for example beam."
        onChange={(event) => change("slug", event.target.value)}
      />
      <TextAreaField
        label="Description"
        name="description"
        rows={2}
        value={description}
        error={save.fieldErrors.description}
        hint="Shown in the tooltip when a matchup has no note."
        onChange={(event) => change("description", event.target.value)}
      />
      <fieldset className="form-field">
        <legend>Heroes ({members.size})</legend>
        <div className="category-members">
          {heroes.map((hero) => (
            <CheckboxField
              key={hero.slug}
              name={`member-${hero.slug}`}
              label={hero.name}
              checked={members.has(hero.slug)}
              onChange={() => toggleMember(hero.slug)}
            />
          ))}
        </div>
      </fieldset>
      <StatusMessage error={save.error} />
      <div className="form__actions">
        <button type="submit" className="button" disabled={save.saving}>
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface MatchupFormProps {
  matchup: AdminCategoryMatchup | null;
  heroes: AdminHero[];
  categories: AdminCategory[];
  existing: AdminCategoryMatchup[];
  onSaved: () => void;
  onClose: () => void;
}

function MatchupForm({
  matchup,
  heroes,
  categories,
  existing,
  onSaved,
  onClose,
}: MatchupFormProps) {
  const { values, change, save } = useAdminForm({
    heroSlug: matchup?.heroSlug ?? "",
    categorySlug: matchup?.categorySlug ?? "",
    type: matchup?.type ?? "STRONG_AGAINST",
    note: matchup?.note ?? "",
  });
  const { heroSlug, categorySlug, type, note } = values;
  const duplicate = existing.some(
    (other) =>
      other.id !== matchup?.id &&
      other.heroSlug === heroSlug &&
      other.categorySlug === categorySlug,
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      heroSlug,
      categorySlug,
      type,
      note: note.trim() === "" ? null : note,
    };
    const saved = await save.run(
      () =>
        matchup
          ? updateCategoryMatchup(matchup.id, payload)
          : createCategoryMatchup(payload),
      "Matchup saved.",
    );
    if (saved) {
      onSaved();
      onClose();
    }
  }

  return (
    <form className="form admin__form" onSubmit={submit}>
      <h2>{matchup ? "Edit matchup" : "New matchup"}</h2>
      <SelectField
        label="Hero"
        name="heroSlug"
        required
        value={heroSlug}
        error={save.fieldErrors.heroSlug}
        onChange={(event) => change("heroSlug", event.target.value)}
      >
        <option value="">Choose a hero</option>
        {heroes.map((hero) => (
          <option key={hero.slug} value={hero.slug}>
            {hero.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Type"
        name="type"
        value={type}
        onChange={(event) =>
          change("type", event.target.value as CategoryMatchupType)
        }
      >
        <option value="STRONG_AGAINST">Strong against</option>
        <option value="WEAK_AGAINST">Struggles against</option>
        <option value="WORKS_WITH">Works well with</option>
      </SelectField>
      <SelectField
        label="Category"
        name="categorySlug"
        required
        value={categorySlug}
        error={save.fieldErrors.categorySlug}
        onChange={(event) => change("categorySlug", event.target.value)}
      >
        <option value="">Choose a category</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Note"
        name="note"
        rows={2}
        value={note}
        error={save.fieldErrors.note}
        onChange={(event) => change("note", event.target.value)}
      />
      {duplicate && (
        <p className="notice notice--error">
          This hero already has a matchup with this category. Edit it instead.
        </p>
      )}
      <StatusMessage error={save.error} />
      <div className="form__actions">
        <button
          type="submit"
          className="button"
          disabled={save.saving || duplicate || !heroSlug || !categorySlug}
        >
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CategoriesAdminPage() {
  usePageTitle("Admin: hero categories");
  const heroes = useHeroOptions();
  const categories = useFetch(fetchCategories, []);
  const matchups = useFetch(fetchCategoryMatchups, []);
  const [editingCategory, setEditingCategory] = useState<
    AdminCategory | "new" | null
  >(null);
  const [deletingCategory, setDeletingCategory] =
    useState<AdminCategory | null>(null);
  const [editingMatchup, setEditingMatchup] = useState<
    AdminCategoryMatchup | "new" | null
  >(null);
  const [deletingMatchup, setDeletingMatchup] =
    useState<AdminCategoryMatchup | null>(null);
  const removal = useSave();
  const heroNames = new Map(heroes.data?.map((hero) => [hero.slug, hero.name]));
  const categoryNames = new Map(
    categories.data?.map((category) => [category.slug, category.name]),
  );
  const heroLabel = (slug: string) => heroNames.get(slug) ?? slug;
  const categoryLabel = (slug: string) => categoryNames.get(slug) ?? slug;

  function reload() {
    categories.reload();
    matchups.reload();
  }

  async function confirmDeleteCategory() {
    if (!deletingCategory) {
      return;
    }
    const removed = await removal.run(
      () => deleteCategory(deletingCategory.id),
      "Category deleted.",
    );
    if (removed) {
      reload();
    }
    setDeletingCategory(null);
  }

  async function confirmDeleteMatchup() {
    if (!deletingMatchup) {
      return;
    }
    const removed = await removal.run(
      () => deleteCategoryMatchup(deletingMatchup.id),
      "Matchup deleted.",
    );
    if (removed) {
      reload();
    }
    setDeletingMatchup(null);
  }

  const failure = categories.error ?? matchups.error ?? heroes.error;

  return (
    <>
      <PageHeader title="Hero categories" />
      <StatusMessage error={removal.error} />
      {(categories.loading || matchups.loading || heroes.loading) && (
        <Spinner label="Loading categories" />
      )}
      {failure && <ErrorMessage failure={failure} onRetry={reload} />}
      {categories.data && (
        <section className="section">
          <div className="section__header">
            <h2>Categories</h2>
            <button
              type="button"
              className="button"
              onClick={() => setEditingCategory("new")}
            >
              New category
            </button>
          </div>
          <DataTable
            rows={categories.data}
            rowKey={(category) => category.id}
            emptyMessage="No categories yet."
            columns={[
              { header: "Name", render: (category) => category.name },
              { header: "Slug", render: (category) => category.slug },
              {
                header: "Heroes",
                render: (category) => category.heroSlugs.length,
              },
              {
                header: "",
                render: (category) => (
                  <RowActions>
                    <RowAction
                      kind="edit"
                      label="Edit"
                      onClick={() => setEditingCategory(category)}
                    />
                    <RowAction
                      kind="delete"
                      label="Delete"
                      onClick={() => setDeletingCategory(category)}
                    />
                  </RowActions>
                ),
              },
            ]}
          />
        </section>
      )}
      {matchups.data && categories.data && (
        <section className="section">
          <div className="section__header">
            <h2>Matchups against categories</h2>
            <button
              type="button"
              className="button"
              onClick={() => setEditingMatchup("new")}
            >
              New matchup
            </button>
          </div>
          <DataTable
            rows={matchups.data}
            rowKey={(matchup) => matchup.id}
            emptyMessage="No matchups yet."
            columns={[
              {
                header: "Hero",
                render: (matchup) => heroLabel(matchup.heroSlug),
              },
              {
                header: "Type",
                render: (matchup) => MATCHUP_LABELS[matchup.type],
              },
              {
                header: "Category",
                render: (matchup) => categoryLabel(matchup.categorySlug),
              },
              {
                header: "",
                render: (matchup) => (
                  <RowActions>
                    <RowAction
                      kind="edit"
                      label="Edit"
                      onClick={() => setEditingMatchup(matchup)}
                    />
                    <RowAction
                      kind="delete"
                      label="Delete"
                      onClick={() => setDeletingMatchup(matchup)}
                    />
                  </RowActions>
                ),
              },
            ]}
          />
        </section>
      )}
      {editingCategory && heroes.data && (
        <Drawer label="Hero category" onClose={() => setEditingCategory(null)}>
          <CategoryForm
            key={editingCategory === "new" ? "new" : editingCategory.id}
            category={editingCategory === "new" ? null : editingCategory}
            heroes={heroes.data}
            onSaved={reload}
            onClose={() => setEditingCategory(null)}
          />
        </Drawer>
      )}
      {editingMatchup && heroes.data && categories.data && (
        <Drawer
          label="Category matchup"
          onClose={() => setEditingMatchup(null)}
        >
          <MatchupForm
            key={editingMatchup === "new" ? "new" : editingMatchup.id}
            matchup={editingMatchup === "new" ? null : editingMatchup}
            heroes={heroes.data}
            categories={categories.data}
            existing={matchups.data ?? []}
            onSaved={reload}
            onClose={() => setEditingMatchup(null)}
          />
        </Drawer>
      )}
      {deletingCategory && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete ${deletingCategory.name}? Matchups against it are deleted too.`}
          busy={removal.saving}
          onConfirm={() => void confirmDeleteCategory()}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
      {deletingMatchup && (
        <ConfirmDialog
          title="Delete matchup"
          message={`Delete the matchup of ${heroLabel(deletingMatchup.heroSlug)} against ${categoryLabel(deletingMatchup.categorySlug)}?`}
          busy={removal.saving}
          onConfirm={() => void confirmDeleteMatchup()}
          onCancel={() => setDeletingMatchup(null)}
        />
      )}
    </>
  );
}
