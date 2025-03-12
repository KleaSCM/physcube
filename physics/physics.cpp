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

const double GRAVITY = 9.81;
const double TIME_STEP = 0.016; // this is 60fps

extern "C"

// initialzie the object in cube
EMSCRIPTEN_KEEPALIVE
void init_object(double x, double y, double z, double vx, double vy, double vz, double mass) {
    objects.clear();
    objects.push_back({ x, y, z, vx, vy, vz, mass });
}

