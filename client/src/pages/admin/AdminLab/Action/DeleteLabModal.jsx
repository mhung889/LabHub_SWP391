import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function DeleteLabModal({ isOpen, onClose, onConfirm, lab }) {
  if (!isOpen || !lab) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='w-full max-w-md rounded-lg border border-border bg-background shadow-lg'>
        {/* HEADER */}
        <div className='flex items-center justify-between border-b border-border p-4'>
          <h2 className='text-lg font-semibold text-foreground'>
            Xóa Phòng Lab
          </h2>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

      
        <div className='p-4 space-y-3'>
          <p className='text-sm text-muted-foreground'>
            Bạn có chắc chắn muốn xóa lab: <span className='font-medium text-foreground text-base'> {lab.name} </span>
          </p>

          <p className='text-sm text-muted-foreground'>
            Hành động này không thể hoàn tác.
          </p>
        </div>

      
        <div className='flex justify-end gap-2 p-4 border-t border-border'>
          <Button variant='outline' onClick={onClose}>
            Hủy
          </Button>

          <Button variant='destructive' onClick={() => onConfirm(lab._id)}>
            Xóa Lab
          </Button>
        </div>
      </div>
    </div>
  );
}
