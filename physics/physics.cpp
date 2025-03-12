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

// basic motion + gravity
EMSCRIPTEN_KEEPALIVE
void update_physics() {
    for (auto& obj : objects) {
        //gravity
        obj.vy -= GRAVITY * TIME_STEP;

        //position
        obj.x += obj.vx * TIME_STEP;
        obj.y += obj.vy * TIME_STEP;
        obj.z += obj.vz * TIME_STEP;

        // elastic bounce, collision with cube
        if (obj.x > 2.5 || obj.x < -2.5) obj.vx *= -1;
        if (obj.y > 2.5 || obj.y < -2.5) obj.vy *= -1;
        if (obj.z > 2.5 || obj.z < -2.5) obj.vz *= -1;
    }
}
     // retrieve possition and return pointer to possitin array

     EMSCRIPTEN_KEEPALIVE
     double* get_object_position() {
         return reinterpret_cast<double*>(&objects[0]);
     }
     
     }