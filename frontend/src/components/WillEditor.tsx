import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  PenLine,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";
import { SignaturePad } from "./SignaturePad";

const SIZES = [
  { label: "Pequeño", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Grande", value: "20px" },
  { label: "Título", value: "28px" },
];

// Downscale an uploaded image to keep the inline base64 reasonable.
const fileToScaledDataUrl = (file: File, maxW = 1000): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const TBtn = ({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
      active
        ? "bg-warm-accent text-white"
        : "text-warm-olive hover:bg-warm-fog hover:text-warm-plum"
    }`}
  >
    {children}
  </button>
);

export const WillEditor = ({
  initialContent,
  onChange,
}: {
  initialContent: string;
  onChange: (html: string) => void;
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      // StarterKit (v3) already bundles bold/italic/underline/lists/heading.
      StarterKit,
      TextStyle,
      Color,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: initialContent || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="h-64 bg-warm-fog rounded-2xl animate-pulse" />;
  }

  const insertImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = await fileToScaledDataUrl(file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertSignature = () => {
    if (pendingSignature) {
      editor.chain().focus().setImage({ src: pendingSignature }).run();
    }
    setPendingSignature(null);
    setSignatureOpen(false);
  };

  return (
    <div className="border border-warm-sand rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-warm-sand bg-warm-fog/40">
        <TBtn title="Deshacer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={16} />
        </TBtn>
        <TBtn title="Rehacer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={16} />
        </TBtn>
        <span className="w-px h-6 bg-warm-sand mx-1" />
        <TBtn
          title="Negrita"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </TBtn>
        <TBtn
          title="Cursiva"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </TBtn>
        <TBtn
          title="Subrayado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </TBtn>
        <span className="w-px h-6 bg-warm-sand mx-1" />
        <TBtn
          title="Título"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </TBtn>
        <TBtn
          title="Subtítulo"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </TBtn>
        <select
          title="Tamaño de texto"
          className="h-9 px-2 rounded-lg bg-white border border-warm-sand text-sm text-warm-olive"
          value=""
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
            e.target.value = "";
          }}
        >
          <option value="">Tamaño</option>
          {SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <label
          title="Color de texto"
          className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer hover:bg-warm-fog relative"
        >
          <span
            className="w-4 h-4 rounded-full border border-warm-sand"
            style={{ background: editor.getAttributes("textStyle").color || "#000000" }}
          />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <span className="w-px h-6 bg-warm-sand mx-1" />
        <TBtn
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </TBtn>
        <TBtn
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </TBtn>
        <span className="w-px h-6 bg-warm-sand mx-1" />
        <TBtn
          title="Alinear izquierda"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </TBtn>
        <TBtn
          title="Centrar"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </TBtn>
        <TBtn
          title="Alinear derecha"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </TBtn>
        <span className="w-px h-6 bg-warm-sand mx-1" />
        <TBtn title="Insertar imagen" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={16} />
        </TBtn>
        <TBtn title="Insertar firma" onClick={() => setSignatureOpen(true)}>
          <PenLine size={16} />
        </TBtn>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void insertImageFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <EditorContent editor={editor} className="will-doc px-5 py-4 min-h-[360px]" />

      {/* Signature modal */}
      <AnimatePresence>
        {signatureOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-warm-plum/30 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setSignatureOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="card w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-2xl text-warm-plum">Tu firma</h3>
                <button
                  type="button"
                  onClick={() => setSignatureOpen(false)}
                  className="text-warm-silver hover:text-warm-plum p-1.5 rounded-lg hover:bg-warm-fog"
                >
                  <X size={18} />
                </button>
              </div>
              <SignaturePad onChange={setPendingSignature} />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setSignatureOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={insertSignature}
                  disabled={!pendingSignature}
                  className="btn-primary"
                >
                  Insertar firma
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
