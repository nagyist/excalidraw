import React from "react";
import { Popover } from "./Popover";
import { isTransparent } from "../utils";

import "./ColorPicker.scss";
import { isArrowKey, KEYS } from "../keys";
import { t, getLanguage } from "../i18n";
import { isWritableElement } from "../utils";
import colors from "../colors";

const isValidColor = (color: string) => {
  const style = new Option().style;
  style.color = color;
  return !!style.color;
};

const getColor = (color: string): string | null => {
  if (isTransparent(color)) {
    return color;
  }

  return isValidColor(color)
    ? color
    : isValidColor(`#${color}`)
    ? `#${color}`
    : null;
};

// This is a narrow reimplementation of the awesome react-color Twitter component
// https://github.com/casesandberg/react-color/blob/master/src/components/twitter/Twitter.js

// Unfortunately, we can't detect keyboard layout in the browser. So this will
// only work well for QWERTY but not AZERTY or others...
const keyBindings = [
  ["1", "2", "3", "4", "5"],
  ["q", "w", "e", "r", "t"],
  ["a", "s", "d", "f", "g"],
  ["z", "x", "c", "v", "b"], //zsviczian
].flat();

const Picker = ({
  colors,
  customPalette, //zsviczian
  color,
  onChange,
  onClose,
  label,
  showInput = true,
  type,
}: {
  colors: string[];
  customPalette: boolean; //zsviczian
  color: string | null;
  onChange: (color: string) => void;
  onClose: () => void;
  label: string;
  showInput: boolean;
  type: "canvasBackground" | "elementBackground" | "elementStroke";
}) => {
  const firstItem = React.useRef<HTMLButtonElement>();
  const activeItem = React.useRef<HTMLButtonElement>();
  const gallery = React.useRef<HTMLDivElement>();
  const colorInput = React.useRef<HTMLInputElement>();

  React.useEffect(() => {
    // After the component is first mounted focus on first input
    if (activeItem.current) {
      activeItem.current.focus();
    } else if (colorInput.current) {
      colorInput.current.focus();
    } else if (gallery.current) {
      gallery.current.focus();
    }
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === KEYS.TAB) {
      const { activeElement } = document;
      if (event.shiftKey) {
        if (activeElement === firstItem.current) {
          colorInput.current?.focus();
          event.preventDefault();
        }
      } else if (activeElement === colorInput.current) {
        firstItem.current?.focus();
        event.preventDefault();
      }
    } else if (isArrowKey(event.key)) {
      const { activeElement } = document;
      const isRTL = getLanguage().rtl;
      const index = Array.prototype.indexOf.call(
        gallery!.current!.children,
        activeElement,
      );
      if (index !== -1) {
        const length = gallery!.current!.children.length - (showInput ? 1 : 0);
        const nextIndex =
          event.key === (isRTL ? KEYS.ARROW_LEFT : KEYS.ARROW_RIGHT)
            ? (index + 1) % length
            : event.key === (isRTL ? KEYS.ARROW_RIGHT : KEYS.ARROW_LEFT)
            ? (length + index - 1) % length
            : event.key === KEYS.ARROW_DOWN
            ? (index + 5) % length
            : event.key === KEYS.ARROW_UP
            ? (length + index - 5) % length
            : index;
        (gallery!.current!.children![nextIndex] as any).focus();
      }
      event.preventDefault();
    } else if (
      keyBindings.includes(event.key.toLowerCase()) &&
      !isWritableElement(event.target)
    ) {
      const index = keyBindings.indexOf(event.key.toLowerCase());
      (gallery!.current!.children![index] as any).focus();
      event.preventDefault();
    } else if (event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) {
      event.preventDefault();
      onClose();
    }
    event.nativeEvent.stopImmediatePropagation();
    event.stopPropagation();
  };

  return (
    <div
      className={`color-picker color-picker-type-${type}`}
      role="dialog"
      aria-modal="true"
      aria-label={t("labels.colorPicker")}
      onKeyDown={handleKeyDown}
    >
      <div className="color-picker-triangle color-picker-triangle-shadow"></div>
      <div className="color-picker-triangle"></div>
      <div
        className="color-picker-content"
        ref={(el) => {
          if (el) {
            gallery.current = el;
          }
        }}
        tabIndex={0}
      >
        {colors.map((_color, i) => {
          const _colorWithoutHash = _color.replace("#", "");
          return (
            <button
              className="color-picker-swatch"
              onClick={(event) => {
                (event.currentTarget as HTMLButtonElement).focus();
                onChange(_color);
              }}
              title={`${
                customPalette ? _color : t(`colors.${_colorWithoutHash}`) //zsviczian
              }${!isTransparent(_color) ? ` (${_color})` : ""} — ${
                keyBindings.length > i ? keyBindings[i].toUpperCase() : ""
              }`} //zsviczian
              aria-label={
                customPalette ? _color : t(`colors.${_colorWithoutHash}`) //zsviczian
              }
              aria-keyshortcuts={keyBindings.length > i ? keyBindings[i] : ""} //zsviczian
              style={{ color: _color }}
              key={customPalette ? type + _color : _color} //zsviczian
              ref={(el) => {
                if (el && i === 0) {
                  firstItem.current = el;
                }
                if (el && _color === color) {
                  activeItem.current = el;
                }
              }}
              onFocus={() => {
                onChange(_color);
              }}
            >
              {isTransparent(_color) ? (
                <div className="color-picker-transparent"></div>
              ) : undefined}
              <span className="color-picker-keybinding">
                {
                  keyBindings.length > i ? keyBindings[i] : "" //zsviczian
                }
              </span>
            </button>
          );
        })}
        {showInput && (
          <ColorInput
            color={color}
            label={label}
            onChange={(color) => {
              onChange(color);
            }}
            ref={colorInput}
          />
        )}
      </div>
    </div>
  );
};

const ColorInput = React.forwardRef(
  (
    {
      color,
      onChange,
      label,
    }: {
      color: string | null;
      onChange: (color: string) => void;
      label: string;
    },
    ref,
  ) => {
    const [innerValue, setInnerValue] = React.useState(color);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
      setInnerValue(color);
    }, [color]);

    React.useImperativeHandle(ref, () => inputRef.current);

    const changeColor = React.useCallback(
      (inputValue: string) => {
        const value = inputValue.toLowerCase();
        const color = getColor(value);
        if (color) {
          onChange(color);
        }
        setInnerValue(value);
      },
      [onChange],
    );

    return (
      <label className="color-input-container">
        <div className="color-picker-hash">#</div>
        <input
          spellCheck={false}
          className="color-picker-input"
          aria-label={label}
          onChange={(event) => changeColor(event.target.value)}
          value={(innerValue || "").replace(/^#/, "")}
          onBlur={() => setInnerValue(color)}
          ref={inputRef}
        />
      </label>
    );
  },
);

export const ColorPicker = ({
  type,
  color,
  onChange,
  label,
  isActive,
  setActive,
  colorPalette, //zsviczian
}: {
  type: "canvasBackground" | "elementBackground" | "elementStroke";
  color: string | null;
  onChange: (color: string) => void;
  label: string;
  isActive: boolean;
  setActive: (active: boolean) => void;
  colorPalette: {
    canvasBackground?: string[];
    elementBackground?: string[];
    elementStroke?: string[];
  }; //zsviczian
}) => {
  const pickerButton = React.useRef<HTMLButtonElement>(null);
  const customPalette = typeof colorPalette[type] !== "undefined"; //zsviczian
  const palette = customPalette
    ? colorPalette[type] ?? colors[type]
    : colors[type]; //zsviczian
  return (
    <div>
      <div className="color-picker-control-container">
        <button
          className="color-picker-label-swatch"
          aria-label={label}
          style={color ? { "--swatch-color": color } : undefined}
          onClick={() => setActive(!isActive)}
          ref={pickerButton}
        />
        <ColorInput
          color={color}
          label={label}
          onChange={(color) => {
            onChange(color);
          }}
        />
      </div>
      <React.Suspense fallback="">
        {isActive ? (
          <Popover
            onCloseRequest={(event) =>
              event.target !== pickerButton.current && setActive(false)
            }
          >
            <Picker
              colors={palette} //zsviczian
              customPalette={customPalette} //zsviczian
              color={color || null}
              onChange={(changedColor) => {
                onChange(changedColor);
              }}
              onClose={() => {
                setActive(false);
                pickerButton.current?.focus();
              }}
              label={label}
              showInput={false}
              type={type}
            />
          </Popover>
        ) : null}
      </React.Suspense>
    </div>
  );
};
