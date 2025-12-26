import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Cpu } from "lucide-react";

interface VehicleFeaturesDisplayProps {
  make: string;
  model: string;
  year: number;
}

interface VehicleFeatures {
  id: number;
  year: number;
  make: string;
  model: string;
  vinSupport: string | null;
  rpm: string | null;
  speed: string | null;
  milState: string | null;
  ignitionStatus: string | null;
  preciseFuel: string | null;
  trueOdometer: string | null;
  driverSeatBelt: string | null;
  tirePressure: string | null;
  doorLockStatus: string | null;
  oilPercent: string | null;
  maf: string | null;
  map: string | null;
  evStateOfCharge: string | null;
  evRange: string | null;
  evChargingStatus: string | null;
  evStateOfHealth: string | null;
}

interface FeaturesResponse {
  found: boolean;
  features?: VehicleFeatures;
}

const featureLabels: Record<string, string> = {
  vinSupport: "VIN Support",
  rpm: "RPM",
  speed: "Speed",
  milState: "MIL State",
  ignitionStatus: "Ignition Status",
  preciseFuel: "Precise Fuel",
  trueOdometer: "True Odometer",
  driverSeatBelt: "Driver Seat Belt",
  tirePressure: "Tire Pressure",
  doorLockStatus: "Door Lock Status",
  oilPercent: "Oil %",
  maf: "MAF",
  map: "MAP",
  evStateOfCharge: "EV State of Charge",
  evRange: "EV Range",
  evChargingStatus: "EV Charging Status",
  evStateOfHealth: "EV State of Health",
};

function FeatureBadge({ value }: { value: string | null }) {
  if (!value || value === "N/A" || value === "NA") {
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs px-1.5 py-0" data-testid="badge-feature-na">
        <XCircle className="w-2.5 h-2.5 mr-0.5" />
        N/A
      </Badge>
    );
  }

  if (value.toLowerCase() === "yes") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-xs px-1.5 py-0" data-testid="badge-feature-yes">
        <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
        Yes
      </Badge>
    );
  }

  if (value.toLowerCase() === "no") {
    return (
      <Badge variant="destructive" className="text-xs px-1.5 py-0" data-testid="badge-feature-no">
        <XCircle className="w-2.5 h-2.5 mr-0.5" />
        No
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs px-1.5 py-0" data-testid="badge-feature-custom">
      {value}
    </Badge>
  );
}

export default function VehicleFeaturesDisplay({ make, model, year }: VehicleFeaturesDisplayProps) {
  const { data, isLoading, isError } = useQuery<FeaturesResponse>({
    queryKey: ['/api/vehicle-features', make, model, year],
    queryFn: async () => {
      const response = await fetch(`/api/vehicle-features/${encodeURIComponent(make.toUpperCase())}/${encodeURIComponent(model.toUpperCase())}/${year}`);
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    },
    enabled: !!make && !!model && !!year,
  });

  if (isLoading) {
    return (
      <Card className="mt-2" data-testid="card-features-loading">
        <CardContent className="py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading capabilities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data?.found) {
    return (
      <Card className="mt-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800" data-testid="card-features-not-found">
        <CardContent className="py-2">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Feature capability data not available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const features = data.features!;
  const featureKeys = [
    'vinSupport', 'rpm', 'speed', 'milState', 'ignitionStatus', 
    'preciseFuel', 'trueOdometer', 'driverSeatBelt', 'tirePressure', 
    'doorLockStatus', 'oilPercent', 'maf', 'map',
    'evStateOfCharge', 'evRange', 'evChargingStatus', 'evStateOfHealth'
  ] as const;

  const standardFeatures = featureKeys.slice(0, 13);
  const evFeatures = featureKeys.slice(13);

  const hasEvFeatures = evFeatures.some(key => {
    const val = features[key];
    return val && val !== "N/A" && val !== "NA";
  });

  return (
    <Card className="mt-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800" data-testid="card-vehicle-features">
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Cpu className="w-4 h-4 text-blue-600" />
          Device Capabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {standardFeatures.map((key) => (
            <div key={key} className="flex flex-col gap-0.5" data-testid={`feature-${key}`}>
              <span className="text-[10px] text-muted-foreground leading-tight">{featureLabels[key]}</span>
              <FeatureBadge value={features[key]} />
            </div>
          ))}
        </div>

        {hasEvFeatures && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs font-medium mb-1 text-green-600 dark:text-green-400">EV Metrics</p>
            <div className="grid grid-cols-4 gap-2">
              {evFeatures.map((key) => (
                <div key={key} className="flex flex-col gap-0.5" data-testid={`feature-${key}`}>
                  <span className="text-[10px] text-muted-foreground leading-tight">{featureLabels[key]}</span>
                  <FeatureBadge value={features[key]} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
