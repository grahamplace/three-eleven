import React from "react";
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
import { useState, useEffect } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
interface ServiceRequestDrawerProps {
  selectedRequest: ServiceRequestDTOThin | null;
  selectedRequestData: ServiceRequest | null;
}

export default function ServiceRequestDetail({
  selectedRequest,
  selectedRequestData,
}: ServiceRequestDrawerProps) {
  const { setSelectedRequestId } = useMapContext();

  const handleUnsetSelectedRequest = () => {
    setSelectedRequestId(null);
    setIsImageOverlayOpen(false);
  };

  const isOpen = Boolean(selectedRequest);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isImageOverlayOpen) {
          setIsImageOverlayOpen(false);
        } else if (isOpen) {
          handleUnsetSelectedRequest();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageOverlayOpen, isOpen]);

  const content = (
    <>
      <div className="p-4 space-y-4 overflow-y-auto">
        {/* TODO: Loading state for while SR data is fetching */}
        {selectedRequestData && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm transition-colors duration-200">
              <div className="grid grid-cols-1 gap-y-4">
                {/* Request ID and Status */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      Request {selectedRequestData.service_request_id}
                    </h3>
                    <button
                      onClick={handleUnsetSelectedRequest}
                      className="hidden md:block hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedRequestData.status_description === "Closed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      }`}
                    >
                      {selectedRequestData.status_description ||
                        "Unknown Status"}
                    </span>
                    {selectedRequestData.status_notes && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400 text-xs">
                        ({selectedRequestData.status_notes})
                      </span>
                    )}
                  </div>
                </div>

                {/* Service Information */}
                <div className="border-t pt-3 dark:border-gray-700">
                  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Service Information
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Service Type
                      </span>
                      <span>{selectedRequestData.service_name || "N/A"}</span>
                    </div>
                    {selectedRequestData.service_subtype && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Subtype
                        </span>
                        <span>
                          {selectedRequestData.service_subtype.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>
                    )}
                    {selectedRequestData.service_details && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Details
                        </span>
                        <span>
                          {selectedRequestData.service_details.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Responsible Agency
                      </span>
                      <span>
                        {selectedRequestData.agency_responsible || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="border-t pt-3 dark:border-gray-700">
                  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Location
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Address
                      </span>
                      <span>{selectedRequestData.address || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          District
                        </span>
                        <span>
                          District{" "}
                          {selectedRequestData.supervisor_district || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Neighborhood
                        </span>
                        <span>
                          {selectedRequestData.analysis_neighborhood ||
                            selectedRequestData.neighborhoods_sffind_boundaries ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Police District
                      </span>
                      <span>
                        {selectedRequestData.police_district || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="border-t pt-3 dark:border-gray-700">
                  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Requested
                      </span>
                      <span>
                        {new Date(
                          selectedRequestData.requested_datetime
                        ).toLocaleString()}
                      </span>
                    </div>
                    {selectedRequestData.updated_datetime && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Last Updated
                        </span>
                        <span>
                          {new Date(
                            selectedRequestData.updated_datetime
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedRequestData.closed_date && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Closed
                        </span>
                        <span>
                          {new Date(
                            selectedRequestData.closed_date
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border-t pt-3 dark:border-gray-700">
                  <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Additional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Source
                      </span>
                      <span>{selectedRequestData.source || "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Coordinates
                      </span>
                      <span className="truncate">
                        {selectedRequestData.lat && selectedRequestData.long
                          ? `${selectedRequestData.lat.toFixed(5)}, ${selectedRequestData.long.toFixed(5)}`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {selectedRequestData.media_url && (
              <div className="relative w-full h-64">
                <Image
                  src={selectedRequestData.media_url}
                  alt="Service Request Image"
                  fill
                  className="rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  sizes="33vw"
                  onClick={() => setIsImageOverlayOpen(true)}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {isImageOverlayOpen && selectedRequestData?.media_url && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            setIsImageOverlayOpen(false);
          }}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
            <Image
              src={selectedRequestData.media_url}
              alt="Service Request Image"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <button
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            onClick={(e) => {
              setIsImageOverlayOpen(false);
            }}
            aria-label="Close image overlay"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="fixed right-4 top-4 z-20 bg-background/95 p-2 rounded-lg shadow-lg max-w-[calc(100vw-2rem)]">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="w-full md:w-auto flex justify-end">
            <QueryFilterSelector />
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <DateRangePickerWithRange />
          </div>
          <div className="flex items-center gap-2 justify-between px-2">
            <ModeToggle />
            <RecenterButton />
            <LocationButton />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {isDesktop ? (
        <div
          className={`fixed left-0 top-0 h-full bg-background/95 shadow-lg z-30 transition-all duration-300 ease-in-out ${
            isOpen
              ? "w-[min(400px,90vw)] opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          {isOpen && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto scrollbar scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {selectedRequest && content}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Drawer
          open={isOpen}
          onOpenChange={(open) => !open && handleUnsetSelectedRequest()}
          shouldScaleBackground={false}
        >
          <DrawerContent className="max-h-[85vh] overflow-hidden">
            <VisuallyHidden asChild>
              <DrawerHeader className="flex justify-between items-center">
                <DrawerTitle className="transition-colors duration-200 ">
                  Service Request Details
                </DrawerTitle>
              </DrawerHeader>
            </VisuallyHidden>
            <div className="overflow-y-auto h-full pb-8">
              {selectedRequest && content}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
