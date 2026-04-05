import React, { Component } from "react";

const sizerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    visibility: "hidden",
    height: 0,
    overflow: "scroll",
    whiteSpace: "pre",
};

type BaseDivProps = Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "value">;

interface AutosizeDivProps extends BaseDivProps {
    defaultValue?: React.ReactNode;
    extraWidth?: number | string;
    id?: string;
    injectStyles?: boolean;
    inputClassName?: string;
    inputRef?: (element: HTMLDivElement | null) => void;
    inputStyle?: React.CSSProperties;
    minWidth?: number | string;
    onAutosize?: (newWidth: number) => void;
    placeholder?: string;
    placeholderIsMinWidth?: boolean;
    value?: React.ReactNode;
    valueToCalcSize?: React.ReactNode;
    type?: string;
}

interface AutosizeDivState {
    inputWidth: number;
    inputId?: string;
    prevId?: string;
}

const DEFAULT_MIN_WIDTH = 1;
const DEFAULT_INJECT_STYLES = true;

const toNumber = (value: number | string | undefined, fallback: number): number => {
    if (value === undefined) {
        return fallback;
    }

    const parsedValue = typeof value === "number" ? value : Number.parseInt(value, 10);
    return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const copyStyles = (styles: CSSStyleDeclaration, node: HTMLElement): void => {
    node.style.fontSize = styles.fontSize;
    node.style.fontFamily = styles.fontFamily;
    node.style.fontWeight = styles.fontWeight;
    node.style.fontStyle = styles.fontStyle;
    node.style.letterSpacing = styles.letterSpacing;
    node.style.textTransform = styles.textTransform;
};

const isIE =
    typeof window !== "undefined" && window.navigator
        ? /MSIE |Trident\/|Edge\//.test(window.navigator.userAgent)
        : false;

const generateId = (): string | undefined => {
    // we only need an auto-generated ID for stylesheet injection, which is only
    // used for IE. so if the browser is not IE, this should return undefined.
    return isIE ? "_" + Math.random().toString(36).substr(2, 12) : undefined;
};

class AutosizeDiv extends Component<AutosizeDivProps, AutosizeDivState> {
    private mounted = false;

    private input: HTMLDivElement | null = null;

    private placeHolderSizer: HTMLDivElement | null = null;

    private sizer: HTMLDivElement | null = null;

    static getDerivedStateFromProps(
        props: AutosizeDivProps,
        state: AutosizeDivState,
    ): Partial<AutosizeDivState> | null {
        const { id } = props;
        return id !== state.prevId ? { inputId: id || generateId(), prevId: id } : null;
    }

    constructor(props: AutosizeDivProps) {
        super(props);

        const minWidth = toNumber(props.minWidth, DEFAULT_MIN_WIDTH);
        this.state = {
            inputWidth: minWidth,
            inputId: props.id || generateId(),
            prevId: props.id,
        };
    }

    componentDidMount() {
        this.mounted = true;
        this.copyInputStyles();
        this.updateInputWidth();
    }

    componentDidUpdate(prevProps: AutosizeDivProps, prevState: AutosizeDivState) {
        if (prevState.inputWidth !== this.state.inputWidth) {
            if (typeof this.props.onAutosize === "function") {
                this.props.onAutosize(this.state.inputWidth);
            }
        }
        this.updateInputWidth();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    inputRef = (el: HTMLDivElement | null): void => {
        this.input = el;
        if (typeof this.props.inputRef === "function") {
            this.props.inputRef(el);
        }
    };

    placeHolderSizerRef = (el: HTMLDivElement | null): void => {
        this.placeHolderSizer = el;
    };

    sizerRef = (el: HTMLDivElement | null): void => {
        this.sizer = el;
    };

    copyInputStyles() {
        if (!this.mounted || !window.getComputedStyle) {
            return;
        }
        const inputStyles = this.input && window.getComputedStyle(this.input);
        if (!inputStyles || !this.sizer) {
            return;
        }
        copyStyles(inputStyles, this.sizer);
        if (this.placeHolderSizer) {
            copyStyles(inputStyles, this.placeHolderSizer);
        }
    }

    updateInputWidth() {
        if (!this.mounted || !this.sizer || typeof this.sizer.scrollWidth === "undefined") {
            return;
        }

        let newInputWidth: number;
        const minWidth = toNumber(this.props.minWidth, DEFAULT_MIN_WIDTH);

        if (this.props.placeholder && (!this.props.value || (this.props.value && this.props.placeholderIsMinWidth))) {
            newInputWidth = Math.max(this.sizer.scrollWidth, this.placeHolderSizer?.scrollWidth ?? 0) + 2;
        } else {
            newInputWidth = this.sizer.scrollWidth + 2;
        }

        // add extraWidth to the detected width. for number types, this defaults to 16 to allow for the stepper UI
        const extraWidth =
            this.props.type === "number" && this.props.extraWidth === undefined
                ? 16
                : toNumber(this.props.extraWidth, 0);
        newInputWidth += extraWidth;
        if (newInputWidth < minWidth) {
            newInputWidth = minWidth;
        }
        if (newInputWidth !== this.state.inputWidth) {
            this.setState({
                inputWidth: newInputWidth,
            });
        }
    }

    getInput() {
        return this.input;
    }

    focus() {
        this.input?.focus();
    }

    blur() {
        this.input?.blur();
    }

    select() {
        const selectableElement = this.input as (HTMLDivElement & { select?: () => void }) | null;
        selectableElement?.select?.();
    }

    renderStyles() {
        // this method injects styles to hide IE's clear indicator, which messes
        // with input size detection. the stylesheet is only injected when the
        // browser is IE, and can also be disabled by the `injectStyles` prop.
        const injectStyles = this.props.injectStyles ?? DEFAULT_INJECT_STYLES;
        return isIE && injectStyles ? (
            <style
                dangerouslySetInnerHTML={{
                    __html: `input#${this.state.inputId}::-ms-clear {display: none;}`,
                }}
            />
        ) : null;
    }

    render() {
        const sizerValue = [this.props.defaultValue, this.props.valueToCalcSize, ""].reduce(
            (previousValue, currentValue) => {
                if (previousValue !== null && previousValue !== undefined) {
                    return previousValue;
                }
                return currentValue;
            },
        );

        const wrapperStyle: React.CSSProperties = { ...this.props.style };
        if (!wrapperStyle.display) wrapperStyle.display = "inline-block";

        const inputStyle: React.CSSProperties = {
            boxSizing: "content-box",
            width: `${this.state.inputWidth}px`,
            ...this.props.inputStyle,
        };

        const {
            defaultValue,
            extraWidth,
            injectStyles,
            inputClassName,
            inputRef,
            inputStyle: _inputStyle,
            minWidth,
            onAutosize,
            placeholder,
            placeholderIsMinWidth,
            type,
            value,
            valueToCalcSize,
            ...inputProps
        } = this.props;

        const inputDivProps: React.HTMLAttributes<HTMLDivElement> = {
            ...inputProps,
            className: inputClassName,
            id: this.state.inputId,
            style: inputStyle,
        };

        void extraWidth;
        void injectStyles;
        void inputRef;
        void _inputStyle;
        void minWidth;
        void onAutosize;
        void placeholder;
        void placeholderIsMinWidth;
        void type;
        void value;
        void valueToCalcSize;
        void defaultValue;

        return (
            <div className={this.props.className} style={wrapperStyle}>
                {this.renderStyles()}
                <div {...inputDivProps} ref={this.inputRef}>
                    {this.props.value}
                </div>
                <div ref={this.sizerRef} style={sizerStyle}>
                    {sizerValue}
                </div>
                {this.props.placeholder ? (
                    <div ref={this.placeHolderSizerRef} style={sizerStyle}>
                        {this.props.placeholder}
                    </div>
                ) : null}
            </div>
        );
    }
}

export default AutosizeDiv;
