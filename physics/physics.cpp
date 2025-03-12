

#include <emscripten.h>
#include <cmath>

struct Object {
    double x, y, z;
    double vx, vy, vz;
    double radius;
    double mass;
};
const double GRAVITY = -9.81;
// Energy loss on bounces
const double DAMPING = 0.98; 
// Half-length of the cube (5m total)
const double CUBE_SIZE = 2.5; 
Object ball;

extern "C" {
    EMSCRIPTEN_KEEPALIVE void init_object(double x, double y, double z, double vx, double vy, double vz, double radius) {
        ball.x = x;
        ball.y = y;
        ball.z = z;
        ball.vx = vx;
        ball.vy = vy;
        ball.vz = vz;
        ball.radius = radius;
        // Approximate mass of a basketball in kg
        ball.mass = 0.6; 
    }
    EMSCRIPTEN_KEEPALIVE void update_physics(double deltaTime) {
        // Apply gravity
        ball.vy += GRAVITY * deltaTime;

        // Update position
        ball.x += ball.vx * deltaTime;
        ball.y += ball.vy * deltaTime;
        ball.z += ball.vz * deltaTime;
        // Collision with walls
        if (ball.x + ball.radius > CUBE_SIZE) {
            ball.x = CUBE_SIZE - ball.radius;
            ball.vx *= -DAMPING;
        }
        if (ball.x - ball.radius < -CUBE_SIZE) {
            ball.x = -CUBE_SIZE + ball.radius;
            ball.vx *= -DAMPING;
        }
        if (ball.y + ball.radius > CUBE_SIZE) {
            ball.y = CUBE_SIZE - ball.radius;
            ball.vy *= -DAMPING;
        }
        if (ball.y - ball.radius < -CUBE_SIZE) {
            ball.y = -CUBE_SIZE + ball.radius;
            ball.vy *= -DAMPING;
        }
        if (ball.z + ball.radius > CUBE_SIZE) {
            ball.z = CUBE_SIZE - ball.radius;
            ball.vz *= -DAMPING;
        }
        if (ball.z - ball.radius < -CUBE_SIZE) {
            ball.z = -CUBE_SIZE + ball.radius;
            ball.vz *= -DAMPING;
        }
    }
    EMSCRIPTEN_KEEPALIVE double* get_object_position() {
        static double pos[3];
        pos[0] = ball.x;
        pos[1] = ball.y;
        pos[2] = ball.z;
        return pos;
    }
    EMSCRIPTEN_KEEPALIVE void reset_object() {
        init_object(0, 2, 0, 0, 0, 0, 0.24); // reset
    }
}
