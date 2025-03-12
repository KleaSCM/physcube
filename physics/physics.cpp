#include <emscripten.h>
#include <vector>
#include <cmath>

struct Object {
    double x, y, z;
    double vx, vy, vz;
    double mass;
}; 

std::vector<Object> objects;

// constraints for the simulation

