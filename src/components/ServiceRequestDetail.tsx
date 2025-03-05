import Image from "next/image";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { ServiceRequest } from "@/entities";
import { ServiceRequestDTOThin } from "@/entities/data-transfer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ModeToggle } from "@/components/ModeToggle";
import { useMapContext } from "@/contexts/MapContext";
import DateRangePickerWithRange from "@/components/DatePickerWithRange";
import { RecenterButton } from "@/components/RecenterButton";
import { LocationButton } from "./LocationButton";
import { QueryFilterSelector } from "./QueryFilterSelector";
interface ServiceRequestDrawerProps {
  selectedRequest: ServiceRequestDTOThin | null;
  selectedRequestData: ServiceRequest | null;
}

export default function ServiceRequestDetail({
  selectedRequest,
  selectedRequestData,
}: ServiceRequestDrawerProps) {
  const { setSelectedRequestId } = useMapContext();
  const isOpen = Boolean(selectedRequest);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <div className="p-4 space-y-4 min-h-[calc(100vh-150px)] max-h-[calc(100vh-150px)] overflow-y-auto">
      {/* TODO: Loading state for while SR data is fetching */}
      {selectedRequestData && (
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
      )}
    </div>
  );

  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 bg-background/95 p-2 rounded-lg shadow-lg">
        <QueryFilterSelector />

        <DateRangePickerWithRange />
        <ModeToggle />
        <RecenterButton />
        <LocationButton />
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
        </DrawerContent>
      </Drawer>
    </>
  );
}
