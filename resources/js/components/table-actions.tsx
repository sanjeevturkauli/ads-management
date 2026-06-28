import { Link } from '@inertiajs/react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

interface TableActionsProps {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    viewHref?: string;
    editHref?: string;
    showView?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
}

export function TableActions({
    onView,
    onEdit,
    onDelete,
    viewHref,
    editHref,
    showView = true,
    showEdit = true,
    showDelete = true,
}: TableActionsProps) {
    return (
        <ButtonGroup>
            {showView && viewHref && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={viewHref}>
                        <Eye />
                    </Link>
                </Button>
            )}
            {showView && !viewHref && (
                <Button variant="outline" size="sm" onClick={onView}>
                    <Eye />
                </Button>
            )}

            {showEdit && editHref && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={editHref}>
                        <Edit2 />
                    </Link>
                </Button>
            )}
            {showEdit && !editHref && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit2 />
                </Button>
            )}

            {showDelete && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 />
                </Button>
            )}
        </ButtonGroup>
    );
}
