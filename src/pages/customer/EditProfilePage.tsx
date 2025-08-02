
import { EditProfileForm } from '@/components/customer/EditProfileForm';

export const EditProfilePage = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Saya</h1>
        <p className="text-gray-600">Kelola informasi profile Anda</p>
      </div>
      
      <EditProfileForm />
    </div>
  );
};
