import React from "react";
import { ButtonGroup, ButtonToolbar, Button } from "react-bootstrap";

const ButtonToolbarGroup = ({ buttons, size = "xsmall" }) => (
  <ButtonToolbar>
    <ButtonGroup>
      {buttons.map(b => (
        <Button
          bsSize={size}
          key={b.title}
          className={b.active ? "active" : null}
          onClick={b.onClick}
          title={b.title}
        >
          {b.content}
        </Button>
      ))}
    </ButtonGroup>
  </ButtonToolbar>
);
export default ButtonToolbarGroup;
