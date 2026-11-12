import { StatusMessage } from "../../admin";
import { useSave } from "../../admin";
import { exportAccount } from "../api/accountApi";

export function ExportAccount() {
  const save = useSave();

  async function download() {
    await save.run(async () => {
      const blob = await exportAccount();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "overlab-account.json";
      link.click();
      URL.revokeObjectURL(url);
    }, "Download started.");
  }

  return (
    <>
      <StatusMessage error={save.error} />
      <button
        type="button"
        className="button button--ghost"
        disabled={save.saving}
        onClick={() => void download()}
      >
        Download my data
      </button>
    </>
  );
}
