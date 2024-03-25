import * as React from "react";

import autosize from "autosize";
// import * as autosize from "autosize";
import * as PropTypes from "prop-types";

import { lineHeight } from "./LineHeight";

const getLineHeight = lineHeight as (element: HTMLElement) => number | null;

export namespace TextareaAutosizeNS {
    export type RequiredProps = Pick<
        React.HTMLProps<HTMLTextAreaElement>,
        Exclude<keyof React.HTMLProps<HTMLTextAreaElement>, "ref">
    > & {
        /** Called whenever the textarea resizes */
        onResize?: (e: Event) => void;
        /** Minimum number of visible rows */
        rows?: React.HTMLProps<HTMLTextAreaElement>["rows"];
        /** Maximum number of visible rows */
        maxRows?: number;
        /** Initialize `autosize` asynchronously.
         * Enable it if you are using StyledComponents
         * This is forced to true when `maxRows` is set.
         */
        async?: boolean;
    };
    export type DefaultProps = {
        rows: number;
        async: boolean;
    };
    export type Props = RequiredProps & Partial<DefaultProps>;
    export type State = {
        lineHeight: number | null;
    };
}

const RESIZED = "autosize:resized";

type InnerProps = TextareaAutosizeNS.Props & {
    innerRef: React.Ref<HTMLTextAreaElement> | null;
};

/**
 * A light replacement for built-in textarea component
 * which automaticaly adjusts its height to match the content
 */
class TextareaAutosizeClass extends React.Component<InnerProps, TextareaAutosizeNS.State> {
    static defaultProps: TextareaAutosizeNS.DefaultProps = {
        rows: 1,
        async: false,
    };

    static propTypes: {
        [key in keyof InnerProps]: PropTypes.Requireable<any>;
    } = {
        rows: PropTypes.number,
        maxRows: PropTypes.number,
        onResize: PropTypes.func,
        innerRef: PropTypes.any,
        async: PropTypes.bool,
    };

    state: TextareaAutosizeNS.State = {
        lineHeight: null,
    };

    textarea: HTMLTextAreaElement | null = null;
    currentValue: InnerProps["value"];

    onResize = (e: Event): void => {
        if (this.props.onResize) {
            this.props.onResize(e);
        }
    };

    componentDidMount() {
        const { maxRows, async } = this.props;

        if (typeof maxRows === "number") {
            this.updateLineHeight();
        }

        if (typeof maxRows === "number" || async) {
            /*
        the defer is needed to:
          - force "autosize" to activate the scrollbar when this.props.maxRows is passed
          - support StyledComponents (see #71)
      */
            setTimeout(() => this.textarea && autosize(this.textarea));
        } else {
            this.textarea && autosize(this.textarea);
        }

        if (this.textarea) {
            this.textarea.addEventListener(RESIZED, this.onResize);
        }
    }

    componentWillUnmount() {
        if (this.textarea) {
            this.textarea.removeEventListener(RESIZED, this.onResize);
            autosize.destroy(this.textarea);
        }
    }

    updateLineHeight = () => {
        if (this.textarea) {
            this.setState({
                lineHeight: getLineHeight(this.textarea),
            });
        }
    };

    onChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const { onChange } = this.props;
        this.currentValue = e.currentTarget.value;
        onChange && onChange(e);
    };

    render() {
        const {
            props: { onResize, maxRows, onChange, style, innerRef, children, ...props },
            state: { lineHeight },
        } = this;

        const maxHeight = maxRows && lineHeight ? lineHeight * maxRows : null;
        const minHeight = props.rows ? { minHeight: `${props.rows}em` } : {};

        return (
            <textarea
                {...props}
                onChange={this.onChange}
                style={maxHeight ? { ...style, maxHeight, ...minHeight } : { ...style, ...minHeight }}
                ref={(element) => {
                    this.textarea = element;
                    if (typeof this.props.innerRef === "function") {
                        this.props.innerRef(element);
                    } else if (this.props.innerRef) {
                        (this.props.innerRef as any).current = element;
                    }
                }}
            >
                {children}
            </textarea>
        );
    }

    componentDidUpdate() {
        this.textarea && autosize.update(this.textarea);
    }
}

export const TextareaAutosize = React.forwardRef(
    (props: TextareaAutosizeNS.Props, ref: React.Ref<HTMLTextAreaElement> | null) => {
        return <TextareaAutosizeClass {...props} innerRef={ref} />;
    },
);
