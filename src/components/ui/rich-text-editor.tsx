import * as React from "react";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, disabled, className, rows = 4 }, ref) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [isEmpty, setIsEmpty] = React.useState(!value);

    // Calculate min-height based on rows (approximate line height of 24px)
    const minHeight = rows * 24;

    const handleInput = React.useCallback(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        const textContent = editorRef.current.textContent || '';
        setIsEmpty(!textContent.trim());
        onChange(html);
      }
    }, [onChange]);

    const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      
      // Get HTML content from clipboard if available
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      
      if (html) {
        // Clean the HTML to only allow safe formatting tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove scripts and other dangerous elements
        const scripts = tempDiv.querySelectorAll('script, style, iframe, object, embed');
        scripts.forEach(el => el.remove());
        
        // Insert cleaned HTML
        document.execCommand('insertHTML', false, tempDiv.innerHTML);
      } else if (text) {
        // Insert plain text
        document.execCommand('insertText', false, text);
      }
      
      handleInput();
    }, [handleInput]);

    // Sync value prop with editor content
    React.useEffect(() => {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
        setIsEmpty(!editorRef.current.textContent?.trim());
      }
    }, [value]);

    return (
      <div className="relative">
        <div
          ref={(node) => {
            (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          contentEditable={!disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "overflow-auto",
            disabled && "cursor-not-allowed opacity-50",
            "[&_b]:font-bold [&_strong]:font-bold",
            "[&_i]:italic [&_em]:italic",
            "[&_u]:underline",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-1",
            "[&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1",
            "[&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1",
            "[&_p]:my-1",
            className
          )}
          style={{ minHeight: `${minHeight}px` }}
          suppressContentEditableWarning
        />
        {isEmpty && placeholder && (
          <div 
            className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none"
            aria-hidden="true"
          >
            {placeholder}
          </div>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
