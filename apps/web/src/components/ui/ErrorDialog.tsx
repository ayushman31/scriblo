import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const ErrorDialog = ({
  isOpen,
  onClose,
  title,
  message,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}: ErrorDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-fit border-2 border-gray-300 dark:border-white bg-white dark:bg-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white cursor-default">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-gray-700 dark:text-gray-300 text-center cursor-default">
            {message}
          </p>

          <div className="flex flex-col gap-3">
            {actionText && onAction && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onAction();
                  onClose();
                }}
              >
                {actionText}
              </Button>
            )}
            
            {secondaryActionText && onSecondaryAction && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onSecondaryAction();
                  onClose();
                }}
              >
                {secondaryActionText}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
