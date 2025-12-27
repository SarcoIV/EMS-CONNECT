<?php

namespace App\Services;

/**
 * Polyline Decoder
 *
 * Decodes encoded polyline strings from routing APIs (Google Maps, OpenRouteService)
 * into arrays of latitude/longitude coordinates.
 *
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
class PolylineDecoder
{
    /**
     * Decode an encoded polyline string into array of coordinates.
     *
     * @param  string  $encoded  Encoded polyline string
     * @param  int  $precision  Precision (5 for Google Maps/OpenRouteService)
     * @return array Array of ['latitude' => float, 'longitude' => float]
     */
    public static function decode(string $encoded, int $precision = 5): array
    {
        if (empty($encoded)) {
            return [];
        }

        $points = [];
        $index = 0;
        $len = strlen($encoded);
        $lat = 0;
        $lng = 0;
        $factor = pow(10, $precision);

        while ($index < $len) {
            // Decode latitude
            $b = 0;
            $shift = 0;
            $result = 0;

            do {
                if ($index >= $len) {
                    break;
                }
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $deltaLat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lat += $deltaLat;

            // Decode longitude
            $shift = 0;
            $result = 0;

            do {
                if ($index >= $len) {
                    break;
                }
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $deltaLng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lng += $deltaLng;

            // Return as associative array with latitude/longitude keys
            $points[] = [
                'latitude' => $lat / $factor,
                'longitude' => $lng / $factor,
            ];
        }

        return $points;
    }

    /**
     * Encode an array of coordinates into a polyline string.
     *
     * @param  array  $coordinates  Array of ['latitude' => float, 'longitude' => float]
     * @param  int  $precision  Precision (5 for Google Maps/OpenRouteService)
     * @return string Encoded polyline string
     */
    public static function encode(array $coordinates, int $precision = 5): string
    {
        if (empty($coordinates)) {
            return '';
        }

        $encoded = '';
        $prevLat = 0;
        $prevLng = 0;
        $factor = pow(10, $precision);

        foreach ($coordinates as $point) {
            $lat = round($point['latitude'] * $factor);
            $lng = round($point['longitude'] * $factor);

            // Encode latitude
            $encoded .= self::encodeNumber($lat - $prevLat);
            // Encode longitude
            $encoded .= self::encodeNumber($lng - $prevLng);

            $prevLat = $lat;
            $prevLng = $lng;
        }

        return $encoded;
    }

    /**
     * Encode a single number for polyline encoding.
     *
     * @param  int  $num  Number to encode
     * @return string Encoded string
     */
    private static function encodeNumber(int $num): string
    {
        $encoded = '';
        $num = $num < 0 ? ~($num << 1) : ($num << 1);

        while ($num >= 0x20) {
            $encoded .= chr((0x20 | ($num & 0x1F)) + 63);
            $num >>= 5;
        }

        $encoded .= chr($num + 63);

        return $encoded;
    }
}
