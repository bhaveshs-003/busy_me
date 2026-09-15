import { useRef, useState } from 'react';
import { Download, FileText, Image, Paperclip, Table2, Upload } from 'lucide-react';
import type { FileCategory, MockFile } from '@/types/index';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDate, formatFileSize } from '@/lib/utils';
import * as t from '@/lib/theme';

// =============================================================================
// PackFiles — documents attached to a research pack
//
// Upload and download are simulated: no bytes leave the browser, and nothing is
// persisted beyond the current session's list.
// =============================================================================

/** Steps the fake upload progresses through, in percent. */
const UPLOAD_STEPS = [18, 44, 71, 93, 100];
const UPLOAD_STEP_MS = 260;

function iconForCategory(category: FileCategory) {
  switch (category) {
    case 'image':
      return Image;
    case 'spreadsheet':
      return Table2;
    case 'document':
    case 'pdf':
      return FileText;
    default:
      return Paperclip;
  }
}

export interface PackFilesProps {
  files: MockFile[];
}

export function PackFiles({ files }: PackFilesProps) {
  const addToast = useUIStore((s) => s.addToast);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session-local additions, shown above the pack's seeded files.
  const [uploaded, setUploaded] = useState<MockFile[]>([]);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  function handleDownload(file: MockFile) {
    addToast({
      variant: 'success',
      title: 'Download started',
      message: `${file.filename} (${formatFileSize(file.sizeBytes)}) — simulated.`,
    });
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Let the same file be chosen twice in a row.
    event.target.value = '';
    if (!picked) return;

    setUploadingName(picked.name);
    setProgress(0);

    UPLOAD_STEPS.forEach((value, index) => {
      setTimeout(() => {
        setProgress(value);
        if (value !== 100) return;

        setUploaded((prev) => [
          {
            id: `upload-${Date.now()}`,
            filename: picked.name,
            originalFilename: picked.name,
            mimeType: picked.type || 'application/octet-stream',
            sizeBytes: picked.size,
            category: picked.type.startsWith('image/') ? 'image' : 'document',
            url: '#',
            thumbnailUrl: null,
            uploadedAt: new Date().toISOString(),
            uploadedByUserId: 'user-current',
            isPublic: false,
            checksum: '—',
            metadata: {},
          } as MockFile,
          ...prev,
        ]);
        setUploadingName(null);
        setProgress(0);
        addToast({ variant: 'success', title: 'File attached', message: picked.name });
      }, UPLOAD_STEP_MS * (index + 1));
    });
  }

  const all = [...uploaded, ...files];

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        onChange={handlePick}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={uploadingName !== null}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload file
      </Button>

      {/* Upload progress */}
      {uploadingName && (
        <div className={cn(t.border, t.radius, 'bg-white p-3.5')}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-gray-900">
              {uploadingName}
            </span>
            <span className={cn(t.meta, 'shrink-0 tabular-nums')}>{progress}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {all.length === 0 ? (
        <EmptyState
          icon={<Paperclip />}
          title="No files attached"
          description="Attach a document, deck or spreadsheet so everything for this pack sits together."
          action={{ label: 'Upload file', onClick: () => inputRef.current?.click() }}
        />
      ) : (
        <ul className={cn(t.border, t.radius, 'divide-y divide-gray-100 bg-white')}>
          {all.map((file) => {
            const Icon = iconForCategory(file.category);
            return (
              <li key={file.id} className="flex items-center gap-3 px-3.5 py-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500"
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {file.filename}
                  </span>
                  <span className={cn(t.meta, 'block truncate')}>
                    {formatFileSize(file.sizeBytes)} · {formatDate(file.uploadedAt)}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  aria-label={`Download ${file.filename}`}
                  className={cn('shrink-0 rounded-lg p-2 text-gray-400', t.pressable, t.focusRing)}
                >
                  <Download className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PackFiles;
