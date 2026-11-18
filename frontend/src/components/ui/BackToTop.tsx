import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { preferredScrollBehavior } from "../../utils/motion";

const SHOW_AFTER_PX = 900;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (!visible) {
    return null;
  }
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: preferredScrollBehavior() })
      }
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}
