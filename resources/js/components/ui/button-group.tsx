import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
    ({ className, children, ...props }, ref) => {
        const childCount = React.Children.count(children);
        
        return (
            <div
                ref={ref}
                className={cn('inline-flex -space-x-px rounded-md shadow-sm', className)}
                role="group"
                {...props}
            >
                {React.Children.map(children, (child, index) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, {
                            className: cn(
                                child.props.className,
                                'relative',
                                // First button
                                index === 0 && 'rounded-r-none',
                                // Last button
                                index === childCount - 1 && 'rounded-l-none',
                                // Middle buttons
                                index !== 0 && index !== childCount - 1 && 'rounded-none',
                                // Focus behavior
                                'focus:z-10'
                            ),
                        });
                    }
                    return child;
                })}
            </div>
        );
    }
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };
