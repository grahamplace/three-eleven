import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "./ui/drawer";
import { ServiceRequest } from "@/entities";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ServiceRequestDrawerProps {
  selectedRequest: ServiceRequestDTOThin | null;
  selectedRequestData: ServiceRequest | null;
  setSelectedRequest: (request: ServiceRequestDTOThin | null) => void;
}

export default function ServiceRequestDetail({
  selectedRequest,
  selectedRequestData,
  setSelectedRequest,
}: ServiceRequestDrawerProps) {
  const isOpen = Boolean(selectedRequest);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="p-4 space-y-4">
      {selectedRequestData ? (
        <div className="flex flex-col gap-4">
          <pre className="whitespace-pre-wrap overflow-x-auto bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm">
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
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      )}
    </div>
  );

  if (isDesktop) {
    if (!isOpen) return null;

    return (
      <div className="fixed right-0 top-0 w-1/3 h-screen bg-white/95 dark:bg-gray-800/95 shadow-lg overflow-y-auto z-10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Service Request Details</h2>
            <button
              onClick={() => setSelectedRequest(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && setSelectedRequest(null)}
    >
      <DrawerContent>
        <DrawerHeader className="flex justify-between items-center">
          <DrawerTitle>Service Request Details</DrawerTitle>
          <DrawerClose className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </DrawerClose>
        </DrawerHeader>
        {selectedRequest && content}
      </DrawerContent>
    </Drawer>
  );
}
