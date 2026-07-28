import client from './client';

export const addPrescription = async (prescriptionData) => {
  const { data } = await client.post('/emr/prescriptions', prescriptionData);
  return data;
};

export const getMyPrescriptions = async (patientId = '') => {
  const url = patientId ? `/emr/prescriptions/${patientId}` : '/emr/prescriptions';
  const { data } = await client.get(url);
  return data;
};
