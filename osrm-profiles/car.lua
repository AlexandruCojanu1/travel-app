-- Custom OSRM Car Profile for Brașov, Romania
-- Simulates city traffic with realistic speeds

-- Base speeds (km/h) - slower than default to simulate traffic
local speeds = {
    motorway = 80,
    motorway_link = 60,
    trunk = 60,
    trunk_link = 50,
    primary = 50,
    primary_link = 40,
    secondary = 40,
    secondary_link = 35,
    tertiary = 35,
    tertiary_link = 30,
    residential = 30,  -- Slower in residential areas
    unclassified = 30,
    service = 20,
    living_street = 15,
    pedestrian = 5,
    track = 20,
    path = 5,
    footway = 5,
    cycleway = 5,
    steps = 2,
    default = 30  -- Default speed for unknown road types
}

-- Speed reduction factors for different conditions
local function get_speed_factor(way, result)
    local factor = 1.0
    
    -- Reduce speed in residential areas
    if way:get_value_by_key("highway") == "residential" then
        factor = factor * 0.9
    end
    
    -- Reduce speed if narrow road
    local width = way:get_value_by_key("width")
    if width and tonumber(width) and tonumber(width) < 5 then
        factor = factor * 0.85
    end
    
    -- Reduce speed if surface is poor
    local surface = way:get_value_by_key("surface")
    if surface and (surface == "unpaved" or surface == "gravel" or surface == "dirt") then
        factor = factor * 0.8
    end
    
    return factor
end

-- Main function to process way
function process_way(profile, way, result)
    local highway = way:get_value_by_key("highway")
    
    -- Skip non-drivable ways
    if not highway then
        return
    end
    
    -- Skip pedestrian/cycle paths
    if highway == "footway" or highway == "path" or highway == "cycleway" or highway == "steps" then
        return
    end
    
    -- Skip if access is restricted
    local access = way:get_value_by_key("access")
    if access == "private" or access == "no" then
        return
    end
    
    -- Get base speed
    local speed = speeds[highway] or speeds.default
    
    -- Apply speed reduction factors
    local factor = get_speed_factor(way, result)
    speed = speed * factor
    
    -- Set speed in km/h (will be converted to m/s internally)
    result.forward_speed = speed
    result.backward_speed = speed
    
    -- Set mode
    result.mode = mode.driving
    
    -- Set access
    result.forward_mode = mode.driving
    result.backward_mode = mode.driving
end

function process_node(profile, node, result)
    -- Process traffic lights, stop signs, etc.
    local highway = node:get_value_by_key("highway")
    
    if highway == "traffic_signals" then
        result.traffic_light = true
    elseif highway == "stop" then
        result.stop = true
    end
end

