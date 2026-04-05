import { Component, CSSProperties, InputHTMLAttributes } from "react";

import PropTypes from "prop-types";

interface AutosizeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "className" | "minWidth"> {
    className?: string;
    extraWidth?: number | string;
    id?: string;
    injectStyles?: boolean;
    inputClassName?: string;
    inputRef?: (element: HTMLInputElement | null) => void;
    inputStyle?: CSSProperties;
    minWidth?: number | string;
    onAutosize?: (newWidth: number) => void;
    placeholder?: string;
    placeholderIsMinWidth?: boolean;
    style?: CSSProperties;
    value?: string | number | readonly string[];
}

interface AutosizeInputState {
    inputWidth: number;
    inputId?: string;
    prevId?: string;
}

const sizerStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    visibility: "hidden",
    height: 0,
    overflow: "scroll",
    whiteSpace: "pre",
};

const copyStyles = (styles: CSSStyleDeclaration, node: HTMLElement) => {
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

const generateId = () => {
    // we only need an auto-generated ID for stylesheet injection, which is only
    // used for IE. so if the browser is not IE, this should return undefined.
    return isIE ? "_" + Math.random().toString(36).substr(2, 12) : undefined;
};

class AutosizeInput extends Component<AutosizeInputProps, AutosizeInputState> {
    static propTypes = {
        className: PropTypes.string,
        defaultValue: PropTypes.any,
        extraWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        id: PropTypes.string,
        injectStyles: PropTypes.bool,
        inputClassName: PropTypes.string,
        inputRef: PropTypes.func,
        inputStyle: PropTypes.object,
        minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        onAutosize: PropTypes.func,
        onChange: PropTypes.func,
        placeholder: PropTypes.string,
        placeholderIsMinWidth: PropTypes.bool,
        style: PropTypes.object,
        value: PropTypes.any,
    };

    static defaultProps: Partial<AutosizeInputProps> = {
        minWidth: 1,
        injectStyles: true,
    };

    private mounted = false;

    private input: HTMLInputElement | null = null;

    private placeHolderSizer: HTMLDivElement | null = null;

    private sizer: HTMLDivElement | null = null;

    static getDerivedStateFromProps(
        props: AutosizeInputProps,
        state: AutosizeInputState,
    ): Partial<AutosizeInputState> | null {
        const { id } = props;
        return id !== state.prevId ? { inputId: id || generateId(), prevId: id } : null;
    }

    constructor(props: AutosizeInputProps) {
        super(props);
        this.state = {
            inputWidth: AutosizeInput.getMinWidthValue(props.minWidth),
            inputId: props.id || generateId(),
            prevId: props.id,
        };
    }

    componentDidMount() {
        this.mounted = true;
        this.copyInputStyles();
        this.updateInputWidth();
    }

    componentDidUpdate(_prevProps: AutosizeInputProps, prevState: AutosizeInputState) {
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

    private static getMinWidthValue(minWidth: AutosizeInputProps["minWidth"]): number {
        return typeof minWidth === "number" ? minWidth : parseInt(minWidth ?? "1", 10) || 1;
    }

    inputRef = (el: HTMLInputElement | null) => {
        this.input = el;
        if (typeof this.props.inputRef === "function") {
            this.props.inputRef(el);
        }
    };

    placeHolderSizerRef = (el: HTMLDivElement | null) => {
        this.placeHolderSizer = el;
    };

    sizerRef = (el: HTMLDivElement | null) => {
        this.sizer = el;
    };

    copyInputStyles() {
        if (!this.mounted || !window.getComputedStyle) {
            return;
        }
        const inputStyles = this.input && window.getComputedStyle(this.input);
        if (!inputStyles) {
            return;
        }
        const sizer = this.sizer;
        if (!sizer) {
            return;
        }

        copyStyles(inputStyles, sizer);
        if (this.placeHolderSizer) {
            copyStyles(inputStyles, this.placeHolderSizer);
        }
    }

    updateInputWidth() {
        if (!this.mounted || !this.sizer || typeof this.sizer.scrollWidth === "undefined") {
            return;
        }

        const minWidth = AutosizeInput.getMinWidthValue(this.props.minWidth);
        let newInputWidth;
        if (
            this.props.placeholder &&
            this.placeHolderSizer &&
            (!this.props.value || (this.props.value && this.props.placeholderIsMinWidth))
        ) {
            newInputWidth = Math.max(this.sizer.scrollWidth, this.placeHolderSizer.scrollWidth) + 2;
        } else {
            newInputWidth = this.sizer.scrollWidth + 2;
        }
        // add extraWidth to the detected width. for number types, this defaults to 16 to allow for the stepper UI
        const extraWidth =
            this.props.type === "number" && this.props.extraWidth === undefined
                ? 16
                : parseInt(String(this.props.extraWidth ?? "0"), 10) || 0;
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
        this.input?.select();
    }

    renderStyles() {
        // this method injects styles to hide IE's clear indicator, which messes
        // with input size detection. the stylesheet is only injected when the
        // browser is IE, and can also be disabled by the `injectStyles` prop.
        const { injectStyles } = this.props;
        return isIE && injectStyles ? (
            <style
                dangerouslySetInnerHTML={{
                    __html: `input#${this.state.inputId}::-ms-clear {display: none;}`,
                }}
            />
        ) : null;
    }
    render() {
        const sizerValue = [this.props.defaultValue, this.props.value, ""].reduce((previousValue, currentValue) => {
            if (previousValue !== null && previousValue !== undefined) {
                return previousValue;
            }
            return currentValue;
        });

        const wrapperStyle = { ...this.props.style };
        if (!wrapperStyle.display) wrapperStyle.display = "inline-block";

        const inputStyle: CSSProperties = {
            boxSizing: "content-box",
            width: `${this.state.inputWidth}px`,
            ...this.props.inputStyle,
        };

        const {
            className,
            extraWidth,
            injectStyles,
            inputClassName,
            inputRef,
            minWidth,
            onAutosize,
            placeholderIsMinWidth,
            style,
            ...inputProps
        } = this.props;

        void extraWidth;
        void injectStyles;
        void inputRef;
        void minWidth;
        void onAutosize;
        void placeholderIsMinWidth;
        void style;

        return (
            <div className={className} style={wrapperStyle}>
                {this.renderStyles()}
                <input
                    {...inputProps}
                    className={inputClassName}
                    id={this.state.inputId}
                    style={inputStyle}
                    ref={this.inputRef}
                />
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

export default AutosizeInput;
