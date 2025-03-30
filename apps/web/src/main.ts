import { tap } from "rxjs";
import { $get } from "./lib/dom";
import { handleAction } from "./lib/handle-data-action";
import "./style.css";

handleAction($get("#app-menu"))
  .pipe(
    tap((action) => {
      switch (action.name) {
        case "add-text": {
          break;
        }
        case "add-file": {
          break;
        }
      }
    }),
  )
  .subscribe();
