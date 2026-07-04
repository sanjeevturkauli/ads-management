import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn('inline-flex gap-2', className)}
                role="group"
                {...props}
            >
                {children}
            </div>
        );
    }
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };
