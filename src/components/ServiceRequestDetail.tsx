import Image from "next/image";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { ServiceRequest } from "@/entities";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModeToggle } from "@/components/ModeToggle";
import { useMapContext } from "@/contexts/MapContext";

interface ServiceRequestDrawerProps {
  selectedRequest: ServiceRequestDTOThin | null;
  selectedRequestData: ServiceRequest | null;
  children: React.ReactNode;
}

export default function ServiceRequestDetail({
  selectedRequest,
  selectedRequestData,
  children,
}: ServiceRequestDrawerProps) {
  const { setSelectedRequestId } = useMapContext();
  const isOpen = Boolean(selectedRequest);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="p-4 space-y-4 min-h-[calc(100vh-150px)] max-h-[calc(100vh-150px)] overflow-y-auto">
      {selectedRequestData ? (
        <div className="flex flex-col gap-4">
          <pre className="whitespace-pre-wrap overflow-x-auto bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm transition-colors duration-200">
            {JSON.stringify(selectedRequestData, null, 2)}
          </pre>
          {selectedRequestData.media_url && (
            <div className="relative w-full h-64">
              <Image
                src={selectedRequestData.media_url}
                alt="Service Request Image"
                fill
                className="rounded-lg object-contain"
                sizes="33vw"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 transition-colors duration-200">
          Loading...
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <div className="fixed right-0 top-0 w-1/3 h-16 bg-background/95 border-b border-border z-20 transition-colors duration-200">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 ml-auto">
              <ModeToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
        {isOpen && (
          <div className="fixed right-0 top-16 w-1/3 h-[calc(100vh-64px)] bg-background/95 border-border shadow-lg overflow-y-auto z-10 transition-colors duration-200">
            <div className="p-6 pt-2">{content}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 bg-background/95 p-2 rounded-lg shadow-lg">
        <ModeToggle />
        <ThemeToggle />
      </div>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
      >
        <DrawerContent>
          <DrawerHeader className="flex justify-between items-center">
            <DrawerTitle className="transition-colors duration-200"></DrawerTitle>
          </DrawerHeader>
          {selectedRequest && content}
          {children}
        </DrawerContent>
      </Drawer>
    </>
  );
}
