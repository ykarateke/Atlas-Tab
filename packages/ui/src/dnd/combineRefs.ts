import type { Ref, RefCallback } from "react";

// dnd-kit doesn't ship a ref-merging helper, but a Board/BookmarkItem needs
// to be both draggable (useDraggable) and a drop target (useDroppable) on
// the *same* DOM node — two independent hooks, two independent setNodeRef
// callbacks, one element.
export function combineRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
