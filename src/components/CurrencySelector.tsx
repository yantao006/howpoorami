"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/LanguageProvider";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface CurrencyOption {
  readonly code: string;
  readonly label: string;
  readonly zhLabel: string;
  readonly symbol: string;
}

const CURRENCIES: readonly CurrencyOption[] = [
  { code: "USD", label: "US Dollar", zhLabel: "美元", symbol: "$" },
  { code: "EUR", label: "Euro", zhLabel: "欧元", symbol: "\u20AC" },
  { code: "GBP", label: "British Pound", zhLabel: "英镑", symbol: "\u00A3" },
  { code: "JPY", label: "Japanese Yen", zhLabel: "日元", symbol: "\u00A5" },
  { code: "CHF", label: "Swiss Franc", zhLabel: "瑞士法郎", symbol: "CHF" },
  { code: "CAD", label: "Canadian Dollar", zhLabel: "加元", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar", zhLabel: "澳元", symbol: "A$" },
  { code: "NZD", label: "New Zealand Dollar", zhLabel: "新西兰元", symbol: "NZ$" },
  { code: "SEK", label: "Swedish Krona", zhLabel: "瑞典克朗", symbol: "kr" },
  { code: "NOK", label: "Norwegian Krone", zhLabel: "挪威克朗", symbol: "kr" },
  { code: "DKK", label: "Danish Krone", zhLabel: "丹麦克朗", symbol: "kr" },
  { code: "CNY", label: "Chinese Yuan", zhLabel: "人民币", symbol: "\u00A5" },
  { code: "KRW", label: "South Korean Won", zhLabel: "韩元", symbol: "\u20A9" },
  { code: "INR", label: "Indian Rupee", zhLabel: "印度卢比", symbol: "\u20B9" },
  { code: "BRL", label: "Brazilian Real", zhLabel: "巴西雷亚尔", symbol: "R$" },
  { code: "MXN", label: "Mexican Peso", zhLabel: "墨西哥比索", symbol: "MX$" },
  { code: "SGD", label: "Singapore Dollar", zhLabel: "新加坡元", symbol: "S$" },
  { code: "ZAR", label: "South African Rand", zhLabel: "南非兰特", symbol: "R" },
  { code: "PLN", label: "Polish Zloty", zhLabel: "波兰兹罗提", symbol: "z\u0142" },
  { code: "CZK", label: "Czech Koruna", zhLabel: "捷克克朗", symbol: "K\u010D" },
  { code: "CLP", label: "Chilean Peso", zhLabel: "智利比索", symbol: "CL$" },
  { code: "HUF", label: "Hungarian Forint", zhLabel: "匈牙利福林", symbol: "Ft" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CurrencySelectorProps {
  readonly selected: string;
  readonly onSelect: (code: string) => void;
}

export default function CurrencySelector({ selected, onSelect }: CurrencySelectorProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const instanceId = useId();
  const listboxId = `${instanceId}-currency-listbox`;

  const selectedCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === selected) ?? CURRENCIES[0],
    [selected],
  );

  const activeOptionId =
    activeIndex >= 0 && activeIndex < CURRENCIES.length
      ? `${instanceId}-currency-option-${CURRENCIES[activeIndex].code}`
      : undefined;

  // Callbacks ----------------------------------------------------------------

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const open = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right - window.scrollX,
        width: 224, // w-56 = 14rem = 224px
      });
    }
    setIsOpen(true);
    setActiveIndex(-1);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, close, open]);

  const selectCurrency = useCallback(
    (code: string) => {
      onSelect(code);
      close();
    },
    [onSelect, close],
  );

  // Click-outside (checks both trigger and portal) --------------------------

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // Reposition on scroll / resize -------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right - window.scrollX,
          width: 224,
        });
      }
    }

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Scroll active option into view ------------------------------------------

  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const active = listboxRef.current.querySelector(
      `[data-index="${activeIndex}"]`,
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Keyboard ----------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < CURRENCIES.length - 1 ? prev + 1 : 0,
          );
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : CURRENCIES.length - 1,
          );
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < CURRENCIES.length) {
            selectCurrency(CURRENCIES[activeIndex].code);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          close();
          break;
        }
        case "Home": {
          e.preventDefault();
          setActiveIndex(0);
          break;
        }
        case "End": {
          e.preventDefault();
          setActiveIndex(CURRENCIES.length - 1);
          break;
        }
        default:
          break;
      }
    },
    [isOpen, activeIndex, open, close, selectCurrency],
  );

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={
          language === "zh"
            ? `选择货币，当前为 ${selectedCurrency.code}`
            : `Select currency, current: ${selectedCurrency.code}`
        }
        aria-activedescendant={isOpen ? activeOptionId : undefined}
        className="
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-accent-periwinkle/10 text-accent-periwinkle border border-accent-periwinkle/20
          hover:bg-accent-periwinkle/20 transition-colors duration-200 cursor-pointer
        "
      >
        <span className="tabular-nums">{selectedCurrency.symbol}</span>
        <span>{selectedCurrency.code}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown — rendered as portal to escape stacking contexts */}
      {typeof document !== "undefined" &&
        createPortal(
          isOpen && dropdownPos ? (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: dropdownPos.top,
                right: dropdownPos.right,
                width: dropdownPos.width,
              }}
              className="
                z-[9999]
                rounded-xl border border-border-subtle bg-bg-card
                shadow-lg shadow-black/20 overflow-hidden
                animate-dropdown-in
              "
            >
              <ul
                ref={listboxRef}
                id={listboxId}
                role="listbox"
                aria-label={language === "zh" ? "货币列表" : "Currencies"}
                className="max-h-52 overflow-y-auto py-1"
              >
                {CURRENCIES.map((currency, idx) => {
                  const isSelected = currency.code === selected;
                  const isActive = idx === activeIndex;

                  return (
                    <li
                      key={currency.code}
                      id={`${instanceId}-currency-option-${currency.code}`}
                      role="option"
                      data-index={idx}
                      aria-selected={isSelected}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm cursor-pointer
                        transition-colors duration-100
                        ${isActive ? "bg-accent-periwinkle/15 text-accent-periwinkle" : ""}
                        ${isSelected && !isActive
                          ? "bg-accent-periwinkle/15 text-accent-periwinkle"
                          : ""
                        }
                        ${!isActive && !isSelected
                          ? "text-text-secondary hover:bg-accent-periwinkle/10 hover:text-text-primary"
                          : ""
                        }
                      `}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(e) => {
                        // Prevent focus loss before selection registers
                        e.preventDefault();
                      }}
                      onClick={() => selectCurrency(currency.code)}
                    >
                      <span className="w-8 text-right tabular-nums font-medium shrink-0">
                        {currency.symbol}
                      </span>
                      <span className="flex-1 text-left">
                        {language === "zh" ? currency.zhLabel : currency.label}
                      </span>
                      <span className="text-text-muted text-xs">{currency.code}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null,
          document.body,
        )}
    </div>
  );
}
