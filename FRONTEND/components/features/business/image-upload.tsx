"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, UploadCloud, X, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove: () => void
    disabled?: boolean
    bucket?: string
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    bucket = "business-media",
    className
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const supabase = createClient()

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        try {
            setIsUploading(true)

            // 1. Compress Image
            const compressedBlob = await compressImage(file)
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
            })

            // 2. Generate Unique Path
            const fileExt = "jpg"
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 3. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, compressedFile)

            if (uploadError) {
                throw uploadError
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            onChange(publicUrl)
            toast.success("Imagine încărcată cu succes!")

        } catch (error) {
            console.error("Upload failed:", error)
            toast.error("Eroare la încărcarea imaginii. Verificați conexiunea.")
        } finally {
            setIsUploading(false)
        }
    }, [onChange, supabase, bucket])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        },
        maxFiles: 1,
        disabled: disabled || isUploading
    })

    // State: Has Image
    if (value) {
        return (
            <div className={cn("relative rounded-xl overflow-hidden border-2 border-border group", className)}>
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                    <X className="h-4 w-4" />
                </button>
                <img
                    src={value}
                    alt="Upload"
                    className="w-full h-full object-cover"
                />
            </div>
        )
    }

    // State: Empty / Upload
    return (
        <div
            {...getRootProps()}
            className={cn(
                "relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center p-8 gap-3 min-h-[200px]",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            <input {...getInputProps()} />

            {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-semibold">Se procesează & încarcă...</p>
                </div>
            ) : (
                <>
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">
                            {isDragActive ? "Drop aici!" : "Apasă sau trage o poză"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG, WebP (Max compressed automated)
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
