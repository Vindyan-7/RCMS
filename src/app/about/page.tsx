import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { Bot, Cpu, Zap, Layers, Award, Target, Compass, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Banner */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700">
              <Bot className="h-3.5 w-3.5 text-blue-600" />
              <span>Student Activity Council</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              About Robotics Club
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Fostering innovation, hardware prototyping, and autonomous robotics development for engineers and builders.
            </p>
          </div>

          {/* Mission & Vision Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To provide students with a collaborative workspace, advanced hardware tools, and hands-on guidance to design, build, and program high-performance robots for national and international competitions.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Compass className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                To establish a premier robotics research ecosystem where multidisciplinary teams bridge theoretical engineering concepts with real-world autonomous systems, computer vision, and IoT innovations.
              </p>
            </div>
          </div>

          {/* Technical Wings Grid */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Technical Wings & Specializations</h2>
              <p className="text-xs text-slate-500">Cross-functional engineering domains within the club</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hardware & Fabrication</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  3D printing, CNC machining, PCB fabrication, and structural CAD assembly.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Embedded Control</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ESP32, STM32, Arduino microcontrollers, power electronics, and CAN bus telemetry.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Software & ROS</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ROS2 nodes, kinematics, simulation environments, and web management systems.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI & Vision Systems</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Computer vision, OpenCV object tracking, LiDAR mapping, and autonomous navigation.
                </p>
              </div>
            </div>
          </div>

          {/* Contact / Activity Center info */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900">Student Activity Center (SAC)</h3>
              <p className="text-xs text-slate-500">
                Robotics Club Lab • Open for workshops, hackathons, and technical projects.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
              <Users className="h-4 w-4 text-blue-600" />
              <span>SAC Robotics Campus Lab</span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
