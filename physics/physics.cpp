#include <emscripten.h>
#include <cmath>

const double G = -9.81;  // Gravity (m/s²)
const double DAMPING = 0.85;  // Energy loss on collision
const double FRICTION = 0.01; // Surface rolling friction
const double CUBE_SIZE = 5.0; // Half-size of the 10m³ cube
const double BALL_RADIUS = 0.12;
const double BALL_MASS = 0.625;
// MOI
const double BALL_MOI = (2.0 / 5.0) * BALL_MASS * (BALL_RADIUS * BALL_RADIUS); 
// 3D Vector class
struct Vec3 {
    double x, y, z;
    Vec3 operator+(const Vec3& other) const { return {x + other.x, y + other.y, z + other.z}; }
    Vec3 operator-(const Vec3& other) const { return {x - other.x, y - other.y, z - other.z}; }
    Vec3 operator*(double scalar) const { return {x * scalar, y * scalar, z * scalar}; }
    Vec3& operator+=(const Vec3& other) { x += other.x; y += other.y; z += other.z; return *this; }
    Vec3& operator*=(double scalar) { x *= scalar; y *= scalar; z *= scalar; return *this; }
};
// Ball props
struct Ball {
    Vec3 position;
    Vec3 velocity;
    Vec3 angularVelocity;
};
Ball ball;
//functions for WASM
extern "C" {
    EMSCRIPTEN_KEEPALIVE void init_object(double x, double y, double z, double vx, double vy, double vz) {
        ball.position = {x, y, z};
        ball.velocity = {vx, vy, vz};
        ball.angularVelocity = {0, 0, 0}; // so it doesnt spin
    }
    EMSCRIPTEN_KEEPALIVE void update_physics(double deltaTime, double omegaX, double omegaY) {
        Vec3 omega = {omegaX, 0, omegaY};
        // Gravity
        ball.velocity.y += G * deltaTime;
        // Coriolis force: -2 * (omega × velocity)
        Vec3 coriolisForce = {
            -2 * (omega.y * ball.velocity.z),
            0,
            2 * (omega.x * ball.velocity.y)
        };
        ball.velocity += coriolisForce * deltaTime;
        // Centrifugal force: - (omega × (omega × r))
        Vec3 omegaCrossR = {
            omega.y * ball.position.z - omega.z * ball.position.y,
            omega.z * ball.position.x - omega.x * ball.position.z,
            omega.x * ball.position.y - omega.y * ball.position.x
        };
        Vec3 centrifugalForce = {
            - (omega.y * omegaCrossR.z - omega.z * omegaCrossR.y),
            0,
            (omega.x * omegaCrossR.y - omega.y * omegaCrossR.x)
        };
        ball.velocity += centrifugalForce * deltaTime;
        // rolling friction
        ball.velocity *= (1.0 - FRICTION);
        // possition update
        ball.position += ball.velocity * deltaTime;
        // Collision detection/response
        for (int i = 0; i < 3; i++) {
            double* pos = &ball.position.x + i;
            double* vel = &ball.velocity.x + i;
            if (*pos + BALL_RADIUS > CUBE_SIZE) {
                *pos = CUBE_SIZE - BALL_RADIUS;
                *vel *= -DAMPING;
            } else if (*pos - BALL_RADIUS < -CUBE_SIZE) {
                *pos = -CUBE_SIZE + BALL_RADIUS;
                *vel *= -DAMPING;
            }
        }
        // rolling ball effect
        Vec3 rollingEffect = {
            -ball.velocity.z / BALL_RADIUS,
            0,
            ball.velocity.x / BALL_RADIUS
        };
        ball.angularVelocity += rollingEffect * deltaTime;
    }
    EMSCRIPTEN_KEEPALIVE double* get_object_position() {
        static double pos[3];
        pos[0] = ball.position.x;
        pos[1] = ball.position.y;
        pos[2] = ball.position.z;
        return pos;
    }
}













