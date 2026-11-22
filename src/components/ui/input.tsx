import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('input', className)} {...props} />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('input h-auto min-h-[80px] py-2', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export { Input, Textarea };
