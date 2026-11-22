import { forwardRef, type ReactNode } from 'react';
import { Button, type ButtonProps } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';

type Props = Omit<ButtonProps, 'children'> & { label: string; shortcut?: string; active?: boolean; children: ReactNode };

/** Icon-only shadcn Button with an accessible label and tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, shortcut, active, className, size = 'icon', variant = 'ghost', children, ...rest },
  ref,
) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          type="button"
          aria-label={label}
          variant={variant}
          size={size}
          className={cn(active && 'bg-accent text-foreground', className)}
          {...rest}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-1.5 opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
});

export { Button };
