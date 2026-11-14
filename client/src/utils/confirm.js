// An "Are you sure?" box that matches the rest of the site.
// It replaces the browser's own window.confirm, and is used the same way:
//
//   const ok = await confirmDialog({ title: "Drop this course?", message: "...", confirmLabel: "Drop course", danger: true });
//   if (!ok) return;
//
// It uses the browser's <dialog>, which keeps keyboard focus inside the box and
// closes with the Esc key. The safe choice (Cancel) is focused first.
let count = 0;

export function confirmDialog({ title, message = "", confirmLabel = "Confirm", danger = false }) {
  return new Promise(resolve => {
    const opener = document.activeElement;
    const make = (tag, className, text) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text) element.textContent = text;   // textContent, so names are never read as HTML
      return element;
    };
    count += 1;
    const dialog = make("dialog", "desk-dialog");
    dialog.setAttribute("aria-labelledby", `confirm-title-${count}`);
    const head = make("div", "desk-dialog-head");
    const heading = make("h2", "", title);
    heading.id = `confirm-title-${count}`;
    head.append(heading);
    const body = make("div", "desk-dialog-body");
    if (message) body.append(make("p", "", message));
    const actions = make("div", "desk-dialog-actions");
    const cancel = make("button", "", "Cancel");
    cancel.type = "button";
    const confirm = make("button", danger ? "danger-button" : "primary-button", confirmLabel);
    confirm.type = "button";
    actions.append(cancel, confirm);
    body.append(actions);
    dialog.append(head, body);

    let answer = false;
    cancel.addEventListener("click", () => dialog.close());
    confirm.addEventListener("click", () => { answer = true; dialog.close(); });
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }); // click outside
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (opener && document.contains(opener)) opener.focus(); // back to where the person was
      resolve(answer);
    });
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  });
}
