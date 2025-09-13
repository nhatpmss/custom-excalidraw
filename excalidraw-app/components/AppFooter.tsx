import React from "react";
import { Footer } from "../../packages/excalidraw/index";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";
import { isExcalidrawPlusSignedUser } from "../app_constants";

export const AppFooter = React.memo(() => {
  return (
    <Footer>
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          alignItems: "center",
        }}
      >
        {isExcalidrawPlusSignedUser && (
          <ExcalidrawPlusAppLink />
        )}
      </div>
    </Footer>
  );
});
